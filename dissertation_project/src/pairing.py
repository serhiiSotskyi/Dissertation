from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class SyntheticPairingResult:
    paired: pd.DataFrame
    pairing_type: str
    random_state: int


def _sample_images(image_df: pd.DataFrame, size: int, random_state: int) -> pd.DataFrame:
    replace = len(image_df) < size
    return image_df.sample(n=size, replace=replace, random_state=random_state).reset_index(drop=True)


def build_same_label_pairs(tabular_df: pd.DataFrame, image_df: pd.DataFrame, *, random_state: int) -> SyntheticPairingResult:
    rows = []
    for label_value, tab_subset in tabular_df.groupby("label"):
        img_subset = image_df[image_df["label"] == label_value].reset_index(drop=True)
        sampled_images = _sample_images(img_subset, len(tab_subset), random_state=random_state)
        paired = pd.concat(
            [
                tab_subset.reset_index(drop=True).add_prefix("tab_"),
                sampled_images.reset_index(drop=True).add_prefix("img_"),
            ],
            axis=1,
        )
        rows.append(paired)
    return SyntheticPairingResult(
        paired=pd.concat(rows, ignore_index=True),
        pairing_type="same_label",
        random_state=random_state,
    )


def build_random_pairs(tabular_df: pd.DataFrame, image_df: pd.DataFrame, *, random_state: int) -> SyntheticPairingResult:
    sampled_images = image_df.sample(
        n=len(tabular_df),
        replace=len(image_df) < len(tabular_df),
        random_state=random_state,
    ).reset_index(drop=True)
    paired = pd.concat(
        [
            tabular_df.reset_index(drop=True).add_prefix("tab_"),
            sampled_images.add_prefix("img_"),
        ],
        axis=1,
    )
    return SyntheticPairingResult(paired=paired, pairing_type="random", random_state=random_state)


def add_consistency_flag(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["pair_label_match"] = (out["tab_label"] == out["img_label"]).astype(int)
    return out

