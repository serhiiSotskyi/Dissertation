from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import torch


@dataclass(frozen=True)
class WisconsinArtifacts:
    model_path: Path
    scaler_path: Path


def load_wisconsin_artifacts(model_path: str | Path, scaler_path: str | Path) -> WisconsinArtifacts:
    return WisconsinArtifacts(model_path=Path(model_path), scaler_path=Path(scaler_path))


def load_wisconsin_scaler(scaler_path: str | Path):
    return joblib.load(scaler_path)


def infer_wisconsin(model_path: str | Path, scaler_path: str | Path, features: pd.DataFrame) -> pd.DataFrame:
    scaler = load_wisconsin_scaler(scaler_path)
    model = torch.load(model_path, map_location="cpu")
    model.eval()

    scaled = scaler.transform(features)
    tensor = torch.tensor(scaled, dtype=torch.float32).view(-1, 1, 6, 5)
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()
        preds = (probs >= 0.5).astype(int)
    return pd.DataFrame({"prediction": preds, "probability_malignant": probs})
