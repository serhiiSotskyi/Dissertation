from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
from typing import Iterable

import pandas as pd
from sklearn.model_selection import train_test_split


PATIENT_ID_PATTERN = re.compile(r"^(SOB_[BM]_[A-Z]+-\d+-[A-Z0-9]+|\S+?-\d+-[A-Z0-9]+?)-\d+-\d+$")


@dataclass(frozen=True)
class BreakHisSplit:
    train: pd.DataFrame
    val: pd.DataFrame
    test: pd.DataFrame


def extract_patient_id(filepath: str | Path) -> str:
    """Extract a patient identifier from a BreaKHis filename."""
    stem = Path(filepath).stem
    tokens = stem.split("-")
    if len(tokens) < 3:
        return stem
    return "-".join(tokens[:-2])


def build_binary_records(dataset_root: str | Path) -> pd.DataFrame:
    """Create a tidy dataframe for the binary BreaKHis task."""
    dataset_root = Path(dataset_root)
    binary_root = dataset_root / "classificacao_binaria"
    records: list[dict[str, str]] = []
    for magnification_dir in sorted(binary_root.iterdir()):
        if not magnification_dir.is_dir():
            continue
        for label_dir in sorted(magnification_dir.iterdir()):
            if not label_dir.is_dir():
                continue
            for image_path in sorted(label_dir.glob("*.png")):
                records.append(
                    {
                        "filepath": str(image_path.resolve()),
                        "magnification": magnification_dir.name,
                        "label": label_dir.name,
                        "patient_id": extract_patient_id(image_path),
                        "filename": image_path.name,
                    }
                )
    df = pd.DataFrame(records)
    if df.empty:
        raise FileNotFoundError(f"No PNG images found under {binary_root}")
    return df


def random_image_level_split(
    df: pd.DataFrame,
    *,
    train_size: float = 0.7,
    val_size: float = 0.15,
    test_size: float = 0.15,
    random_state: int = 42,
) -> BreakHisSplit:
    """Reproduce a naive image-level split for leakage auditing."""
    total = round(train_size + val_size + test_size, 10)
    if total != 1.0:
        raise ValueError("train/val/test sizes must sum to 1.0")

    train_df, temp_df = train_test_split(
        df,
        test_size=(1 - train_size),
        stratify=df["label"],
        random_state=random_state,
    )
    relative_test = test_size / (val_size + test_size)
    val_df, test_df = train_test_split(
        temp_df,
        test_size=relative_test,
        stratify=temp_df["label"],
        random_state=random_state,
    )
    return BreakHisSplit(
        train=train_df.reset_index(drop=True),
        val=val_df.reset_index(drop=True),
        test=test_df.reset_index(drop=True),
    )


def patient_level_split(
    df: pd.DataFrame,
    *,
    train_size: float = 0.7,
    val_size: float = 0.15,
    test_size: float = 0.15,
    random_state: int = 42,
) -> BreakHisSplit:
    """Split BreaKHis at patient level to avoid leakage."""
    total = round(train_size + val_size + test_size, 10)
    if total != 1.0:
        raise ValueError("train/val/test sizes must sum to 1.0")

    patients = (
        df[["patient_id", "label"]]
        .drop_duplicates()
        .sort_values(["label", "patient_id"])
        .reset_index(drop=True)
    )

    train_patients, temp_patients = train_test_split(
        patients,
        test_size=(1 - train_size),
        stratify=patients["label"],
        random_state=random_state,
    )
    relative_test = test_size / (val_size + test_size)
    val_patients, test_patients = train_test_split(
        temp_patients,
        test_size=relative_test,
        stratify=temp_patients["label"],
        random_state=random_state,
    )

    train_df = df[df["patient_id"].isin(train_patients["patient_id"])].copy()
    val_df = df[df["patient_id"].isin(val_patients["patient_id"])].copy()
    test_df = df[df["patient_id"].isin(test_patients["patient_id"])].copy()
    return BreakHisSplit(train=train_df, val=val_df, test=test_df)


def patient_overlap_report(split: BreakHisSplit) -> dict[str, int]:
    train_patients = set(split.train["patient_id"])
    val_patients = set(split.val["patient_id"])
    test_patients = set(split.test["patient_id"])
    return {
        "train_val_overlap": len(train_patients & val_patients),
        "train_test_overlap": len(train_patients & test_patients),
        "val_test_overlap": len(val_patients & test_patients),
    }


def patient_overlap_examples(split: BreakHisSplit, limit: int = 10) -> pd.DataFrame:
    train_patients = set(split.train["patient_id"])
    val_patients = set(split.val["patient_id"])
    test_patients = set(split.test["patient_id"])
    overlaps = {
        "train_val": sorted(train_patients & val_patients),
        "train_test": sorted(train_patients & test_patients),
        "val_test": sorted(val_patients & test_patients),
    }
    rows: list[dict[str, str]] = []
    for overlap_name, patient_ids in overlaps.items():
        for patient_id in patient_ids[:limit]:
            rows.append({"overlap": overlap_name, "patient_id": patient_id})
    return pd.DataFrame(rows)


def cohort_summary(df: pd.DataFrame) -> pd.DataFrame:
    summary = (
        df.groupby(["label", "magnification"])
        .agg(images=("filepath", "count"), patients=("patient_id", "nunique"))
        .reset_index()
        .sort_values(["label", "magnification"])
    )
    return summary


def label_summary(df: pd.DataFrame) -> pd.DataFrame:
    return (
        df.groupby("label")
        .agg(images=("filepath", "count"), patients=("patient_id", "nunique"))
        .reset_index()
        .sort_values("label")
    )


def split_label_summary(split: BreakHisSplit) -> pd.DataFrame:
    rows = []
    for subset_name, frame in [("train", split.train), ("val", split.val), ("test", split.test)]:
        for label, label_frame in frame.groupby("label"):
            rows.append(
                {
                    "subset": subset_name,
                    "label": label,
                    "images": len(label_frame),
                    "patients": label_frame["patient_id"].nunique(),
                }
            )
    return pd.DataFrame(rows).sort_values(["subset", "label"]).reset_index(drop=True)


def sample_per_patient(
    df: pd.DataFrame,
    *,
    per_magnification: int = 1,
    random_state: int = 42,
) -> pd.DataFrame:
    sampled_frames: list[pd.DataFrame] = []
    for _, frame in df.groupby(["patient_id", "magnification"]):
        sampled_frames.append(
            frame.sample(
                n=min(len(frame), per_magnification),
                random_state=random_state,
            )
        )
    return pd.concat(sampled_frames, ignore_index=True)


def split_summary(split: BreakHisSplit) -> pd.DataFrame:
    rows = []
    for name, frame in [("train", split.train), ("val", split.val), ("test", split.test)]:
        counts = frame["label"].value_counts().to_dict()
        rows.append(
            {
                "subset": name,
                "images": len(frame),
                "patients": frame["patient_id"].nunique(),
                "benign_images": counts.get("benign", 0),
                "malignant_images": counts.get("malignant", 0),
            }
        )
    return pd.DataFrame(rows)
