from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Literal

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = REPO_ROOT / "dissertation_project"
sys.path.append(str(PROJECT_ROOT))

from src.inference import (  # noqa: E402
    infer_breakhis_image,
    infer_synthetic_fusion_demo,
    infer_wisconsin,
)


def resolve_path(env_name: str, fallback: Path) -> Path:
    configured = os.getenv(env_name)
    if configured:
        return Path(configured).expanduser().resolve()
    return fallback


def get_allowed_origins() -> list[str]:
    configured = os.getenv("CORS_ALLOW_ORIGINS", "*")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    return origins or ["*"]


WISCONSIN_MODEL_PATH = resolve_path(
    "WISCONSIN_MODEL_PATH",
    PROJECT_ROOT / "notebook_Wisconsin" / "model.pt",
)
WISCONSIN_SCALER_PATH = resolve_path(
    "WISCONSIN_SCALER_PATH",
    PROJECT_ROOT / "notebook_Wisconsin" / "scaler.joblib",
)
BREAKHIS_CHECKPOINT_PATH = resolve_path(
    "BREAKHIS_CHECKPOINT_PATH",
    PROJECT_ROOT / "models" / "breakhis_resnet18_patient_level_clean.pth",
)
WISCONSIN_DATA_PATH = resolve_path(
    "WISCONSIN_DATA_PATH",
    PROJECT_ROOT / "notebook_Wisconsin" / "brca.csv",
)
DEMO_PRESETS_PATH = resolve_path(
    "DEMO_PRESETS_PATH",
    PROJECT_ROOT / "outputs" / "reports" / "demo_presets.json",
)

STANDARD_DISCLAIMER = (
    "Research demo only. This interface is not a clinical decision support system and must not be used for diagnosis."
)
SYNTHETIC_DISCLAIMER = (
    "Synthetic fusion demo only. The tabular and image inputs come from independent datasets and are not a real patient-level multimodal record."
)


class TabularRequest(BaseModel):
    features: dict[str, float]


def load_demo_presets():
    if not DEMO_PRESETS_PATH.is_file():
        return None
    return json.loads(DEMO_PRESETS_PATH.read_text())


def load_demo_rows():
    dataframe = pd.read_csv(WISCONSIN_DATA_PATH)
    benign_row = dataframe[dataframe["y"] == "B"].iloc[0].to_dict()
    malignant_row = dataframe[dataframe["y"] == "M"].iloc[0].to_dict()

    def to_features(row: dict[str, object]):
        return {
            key: float(value)
            for key, value in row.items()
            if key not in {"Unnamed: 0", "y"}
        }

    return {
        "feature_order": list(to_features(benign_row).keys()),
        "benign_features": to_features(benign_row),
        "malignant_features": to_features(malignant_row),
    }


def build_demo_cases():
    demo_presets = load_demo_presets()
    if demo_presets is not None:
        return demo_presets

    demo_rows = load_demo_rows()
    benign_features = demo_rows["benign_features"]
    malignant_features = demo_rows["malignant_features"]
    return {
        "featureOrder": demo_rows["feature_order"],
        "tabular": [
            {
                "id": "tabular-benign-published",
                "labelHint": "benign",
                "description": "Published Wisconsin sample expected to read as benign in the tabular branch.",
                "features": benign_features,
            },
            {
                "id": "tabular-malignant-published",
                "labelHint": "malignant",
                "description": "Published Wisconsin sample expected to read as malignant in the tabular branch.",
                "features": malignant_features,
            },
        ],
        "image": [],
        "fusion": [],
    }


def build_response(
    *,
    mode: Literal["tabular", "image", "fusion-demo"],
    probability_malignant: float,
    model_name: str,
    disclaimer_type: str,
    disclaimer_text: str,
    latency_ms: float,
):
    prediction_label = "malignant" if probability_malignant >= 0.5 else "benign"
    return {
        "mode": mode,
        "prediction_label": prediction_label,
        "probability_malignant": probability_malignant,
        "model_name": model_name,
        "disclaimer_type": disclaimer_type,
        "disclaimer_text": disclaimer_text,
        "latency_ms": latency_ms,
    }


def ensure_feature_order(features: dict[str, float]):
    demo_presets = load_demo_presets()
    feature_order = demo_presets["featureOrder"] if demo_presets is not None else load_demo_rows()["feature_order"]
    missing = [feature for feature in feature_order if feature not in features]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing tabular features: {', '.join(missing)}")
    return pd.DataFrame([{feature: features[feature] for feature in feature_order}])


allowed_origins = get_allowed_origins()

app = FastAPI(title="BreaScope AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials="*" not in allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    checks = {
        "wisconsinModel": WISCONSIN_MODEL_PATH.is_file(),
        "wisconsinScaler": WISCONSIN_SCALER_PATH.is_file(),
        "breakhisCheckpoint": BREAKHIS_CHECKPOINT_PATH.is_file(),
    }
    return {
        "status": "ok" if all(checks.values()) else "degraded",
        "backend": "connected",
        "artifactsReady": all(checks.values()),
        "checks": checks,
    }


@app.get("/demo-cases")
def demo_cases():
    return build_demo_cases()


@app.post("/predict/tabular")
def predict_tabular(payload: TabularRequest):
    started = time.perf_counter()
    feature_frame = ensure_feature_order(payload.features)
    result = infer_wisconsin(WISCONSIN_MODEL_PATH, WISCONSIN_SCALER_PATH, feature_frame).iloc[0]
    elapsed_ms = (time.perf_counter() - started) * 1000
    return build_response(
        mode="tabular",
        probability_malignant=float(result["probability_malignant"]),
        model_name="Wisconsin published branch",
        disclaimer_type="research_demo",
        disclaimer_text=STANDARD_DISCLAIMER,
        latency_ms=elapsed_ms,
    )


@app.post("/predict/image")
def predict_image(file: UploadFile = File(...)):
    started = time.perf_counter()
    with Image.open(file.file) as uploaded_image:
        result = infer_breakhis_image(BREAKHIS_CHECKPOINT_PATH, uploaded_image)
    elapsed_ms = (time.perf_counter() - started) * 1000
    return build_response(
        mode="image",
        probability_malignant=float(result["probability_malignant"]),
        model_name="BreaKHis corrected patient-level ResNet18",
        disclaimer_type="research_demo",
        disclaimer_text=STANDARD_DISCLAIMER,
        latency_ms=elapsed_ms,
    )


@app.post("/predict/fusion-demo")
def predict_fusion_demo(
    features: str = Form(...),
    file: UploadFile = File(...),
):
    started = time.perf_counter()
    parsed_features = json.loads(features)
    feature_frame = ensure_feature_order(parsed_features)
    tabular_result = infer_wisconsin(WISCONSIN_MODEL_PATH, WISCONSIN_SCALER_PATH, feature_frame).iloc[0]
    with Image.open(file.file) as uploaded_image:
        image_result = infer_breakhis_image(BREAKHIS_CHECKPOINT_PATH, uploaded_image)
    fusion_result = infer_synthetic_fusion_demo(
        tabular_probability=float(tabular_result["probability_malignant"]),
        image_probability=float(image_result["probability_malignant"]),
    )
    elapsed_ms = (time.perf_counter() - started) * 1000
    return build_response(
        mode="fusion-demo",
        probability_malignant=float(fusion_result["probability_malignant"]),
        model_name="Exploratory synthetic late-fusion demo",
        disclaimer_type="synthetic_demo",
        disclaimer_text=SYNTHETIC_DISCLAIMER,
        latency_ms=elapsed_ms,
    )
