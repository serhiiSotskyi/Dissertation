from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader

from .image_pipeline import BreakHisDataset, build_resnet18, build_transforms, resolve_device
from .metrics import classification_metrics


def load_frozen_wisconsin_dataframe(path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(path).rename(columns={"y": "label"})
    df["label"] = df["label"].map({"B": "benign", "M": "malignant"})
    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])
    return df


def prepare_tabular_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    X = df.drop(columns=["label"]).copy()
    y = (df["label"] == "malignant").astype(int)
    return X, y


def _truncate_resnet(model: torch.nn.Module) -> torch.nn.Module:
    backbone = torch.nn.Sequential(*list(model.children())[:-1])
    return backbone


def extract_image_embeddings(
    dataframe: pd.DataFrame,
    state_dict_path: str | Path,
    *,
    batch_size: int = 32,
) -> pd.DataFrame:
    device = resolve_device()
    _, eval_transform = build_transforms()
    dataset = BreakHisDataset(dataframe, transform=eval_transform)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    model = build_resnet18(device)
    state_dict = torch.load(state_dict_path, map_location=device)
    model.load_state_dict(state_dict)
    model.eval()
    backbone = _truncate_resnet(model).to(device)
    backbone.eval()

    rows = []
    cursor = 0
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            embeddings = backbone(images).flatten(start_dim=1).cpu().numpy()
            batch_meta = dataframe.iloc[cursor : cursor + len(images)].reset_index(drop=True)
            cursor += len(images)
            for idx, emb in enumerate(embeddings):
                row = {
                    "label": batch_meta.loc[idx, "label"],
                    "patient_id": batch_meta.loc[idx, "patient_id"],
                    "filepath": batch_meta.loc[idx, "filepath"],
                }
                for j, value in enumerate(emb.tolist()):
                    row[f"img_emb_{j}"] = value
                rows.append(row)
    return pd.DataFrame(rows)


def aggregate_image_embeddings(embeddings_df: pd.DataFrame) -> pd.DataFrame:
    feature_cols = [col for col in embeddings_df.columns if col.startswith("img_emb_")]
    grouped = (
        embeddings_df.groupby(["patient_id", "label"])[feature_cols]
        .mean()
        .reset_index()
    )
    return grouped


def run_patient_level_image_baseline(
    train_embeddings: pd.DataFrame,
    val_embeddings: pd.DataFrame,
    test_embeddings: pd.DataFrame,
) -> FusionResult:
    feature_cols = [col for col in train_embeddings.columns if col.startswith("img_emb_")]
    train_frame = pd.concat([train_embeddings, val_embeddings], ignore_index=True)
    X_train = train_frame[feature_cols].to_numpy()
    y_train = (train_frame["label"] == "malignant").astype(int).to_numpy()
    X_test = test_embeddings[feature_cols].to_numpy()
    y_test = (test_embeddings["label"] == "malignant").astype(int).to_numpy()
    model = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )
    model.fit(X_train, y_train)
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)
    metrics = classification_metrics(y_test, y_pred, y_prob)
    return FusionResult(metrics=metrics, y_true=y_test, y_pred=y_pred, y_prob=y_prob)


def build_fusion_frame(tabular_pairs: pd.DataFrame, image_pairs: pd.DataFrame) -> pd.DataFrame:
    image_pairs = image_pairs.reset_index(drop=True).copy()
    tabular_pairs = tabular_pairs.reset_index(drop=True).copy()
    if len(tabular_pairs) != len(image_pairs):
        raise ValueError("Tabular and image pairing frames must have equal length")
    return pd.concat(
        [
            tabular_pairs.add_prefix("tab_"),
            image_pairs.add_prefix("img_"),
        ],
        axis=1,
    )


@dataclass
class FusionResult:
    metrics: dict[str, float]
    y_true: np.ndarray
    y_pred: np.ndarray
    y_prob: np.ndarray


def run_logistic_fusion_experiment(
    feature_frame: pd.DataFrame,
    *,
    test_size: float = 0.2,
    random_state: int = 42,
    feature_prefixes: tuple[str, ...] | None = None,
) -> FusionResult:
    feature_cols = [col for col in feature_frame.columns if col not in {"tab_label", "img_label"}]
    if feature_prefixes is not None:
        feature_cols = [col for col in feature_cols if col.startswith(feature_prefixes)]
    feature_cols = [
        col
        for col in feature_cols
        if pd.api.types.is_numeric_dtype(feature_frame[col])
    ]
    y = (feature_frame["tab_label"] == "malignant").astype(int).to_numpy()
    X = feature_frame[feature_cols].to_numpy()
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        stratify=y,
        random_state=random_state,
    )
    model = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )
    model.fit(X_train, y_train)
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)
    metrics = classification_metrics(y_test, y_pred, y_prob)
    return FusionResult(metrics=metrics, y_true=y_test, y_pred=y_pred, y_prob=y_prob)
