from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import torch
from PIL import Image

from .image_pipeline import build_resnet18, build_transforms


@dataclass(frozen=True)
class WisconsinArtifacts:
    model_path: Path
    scaler_path: Path


@dataclass(frozen=True)
class BreakHisArtifacts:
    checkpoint_path: Path
    normalization: str = "breakhis"
    image_size: tuple[int, int] = (224, 224)


def load_wisconsin_artifacts(model_path: str | Path, scaler_path: str | Path) -> WisconsinArtifacts:
    return WisconsinArtifacts(model_path=Path(model_path), scaler_path=Path(scaler_path))


def load_breakhis_artifacts(
    checkpoint_path: str | Path,
    *,
    normalization: str = "breakhis",
    image_size: tuple[int, int] = (224, 224),
) -> BreakHisArtifacts:
    return BreakHisArtifacts(
        checkpoint_path=Path(checkpoint_path),
        normalization=normalization,
        image_size=image_size,
    )


@lru_cache(maxsize=4)
def load_wisconsin_scaler(scaler_path: str | Path):
    return joblib.load(scaler_path)


@lru_cache(maxsize=4)
def load_wisconsin_model(model_path: str | Path):
    model = torch.load(model_path, map_location="cpu")
    model.eval()
    return model


@lru_cache(maxsize=4)
def load_breakhis_model(
    checkpoint_path: str | Path,
    *,
    normalization: str = "breakhis",
    image_size: tuple[int, int] = (224, 224),
):
    _ = normalization
    _ = image_size
    device = torch.device("cpu")
    model = build_resnet18(device, weights=None, checkpoint_path=checkpoint_path)
    model.eval()
    return model


def infer_wisconsin(model_path: str | Path, scaler_path: str | Path, features: pd.DataFrame) -> pd.DataFrame:
    scaler = load_wisconsin_scaler(scaler_path)
    model = load_wisconsin_model(model_path)

    scaled = scaler.transform(features)
    tensor = torch.tensor(scaled, dtype=torch.float32).view(-1, 1, 6, 5)
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()
        preds = (probs >= 0.5).astype(int)
    return pd.DataFrame({"prediction": preds, "probability_malignant": probs})


def infer_breakhis_image(
    checkpoint_path: str | Path,
    image: str | Path | Image.Image,
    *,
    normalization: str = "breakhis",
    image_size: tuple[int, int] = (224, 224),
) -> dict[str, float | int | str]:
    model = load_breakhis_model(
        checkpoint_path,
        normalization=normalization,
        image_size=image_size,
    )
    _, eval_transform = build_transforms(
        image_size=image_size,
        normalization=normalization,
        augment=False,
    )

    opened_image: Image.Image | None = None
    try:
        opened_image = Image.open(image) if isinstance(image, (str, Path)) else image
        rgb_image = opened_image.convert("RGB")
        tensor = eval_transform(rgb_image).unsqueeze(0)
        with torch.no_grad():
            logits = model(tensor)
            probability = float(torch.softmax(logits, dim=1)[:, 1].item())
        prediction = int(probability >= 0.5)
        return {
            "prediction": prediction,
            "prediction_label": "malignant" if prediction else "benign",
            "probability_malignant": probability,
        }
    finally:
        if isinstance(image, (str, Path)) and opened_image is not None:
            opened_image.close()


def infer_synthetic_fusion_demo(
    *,
    tabular_probability: float,
    image_probability: float,
) -> dict[str, float | int | str]:
    probability = float(np.mean([tabular_probability, image_probability]))
    prediction = int(probability >= 0.5)
    return {
        "prediction": prediction,
        "prediction_label": "malignant" if prediction else "benign",
        "probability_malignant": probability,
    }
