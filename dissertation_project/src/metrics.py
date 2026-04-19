from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    accuracy_score,
    auc,
    roc_curve,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def classification_metrics(y_true, y_pred, y_prob=None) -> dict[str, float]:
    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1_score": f1_score(y_true, y_pred, zero_division=0),
    }
    if y_prob is not None:
        metrics["roc_auc"] = roc_auc_score(y_true, y_prob)
        metrics["brier_score"] = brier_score_loss(y_true, y_prob)
    return metrics


def metrics_frame(name: str, metrics: dict[str, float]) -> pd.DataFrame:
    return pd.DataFrame(
        [{"model": name, "metric": metric_name, "value": metric_value} for metric_name, metric_value in metrics.items()]
    )


def expected_calibration_error(y_true, y_prob, *, n_bins: int = 10) -> float:
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    for left, right in zip(bins[:-1], bins[1:]):
        mask = (y_prob >= left) & (y_prob < right if right < 1 else y_prob <= right)
        if not np.any(mask):
            continue
        confidence = y_prob[mask].mean()
        accuracy = y_true[mask].mean()
        ece += np.abs(accuracy - confidence) * mask.mean()
    return float(ece)


def save_confusion_matrix(y_true, y_pred, labels, output_path: str | Path, title: str) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_title(title)
    ax.set_xlabel("Predicted label")
    ax.set_ylabel("True label")
    ax.set_xticks(range(len(labels)), labels)
    ax.set_yticks(range(len(labels)), labels)
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center", color="black")
    fig.colorbar(im, ax=ax)
    fig.tight_layout()
    fig.savefig(output_path, dpi=300)
    plt.close(fig)


def save_calibration_plot(y_true, y_prob, output_path: str | Path, title: str) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=10)
    fig, ax = plt.subplots(figsize=(5, 4))
    ax.plot(prob_pred, prob_true, marker="o", label="Model")
    ax.plot([0, 1], [0, 1], linestyle="--", label="Perfect calibration")
    ax.set_xlabel("Predicted probability")
    ax.set_ylabel("Observed frequency")
    ax.set_title(title)
    ax.legend()
    fig.tight_layout()
    fig.savefig(output_path, dpi=300)
    plt.close(fig)


def save_roc_curve(y_true, y_prob, output_path: str | Path, title: str) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    roc_auc = auc(fpr, tpr)
    fig, ax = plt.subplots(figsize=(5, 4))
    ax.plot(fpr, tpr, label=f"Model (AUC = {roc_auc:.3f})", linewidth=2)
    ax.plot([0, 1], [0, 1], linestyle="--", color="grey", label="Chance")
    ax.set_xlabel("False positive rate")
    ax.set_ylabel("True positive rate")
    ax.set_title(title)
    ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(output_path, dpi=300)
    plt.close(fig)


def save_metric_barplot(
    dataframe: pd.DataFrame,
    *,
    x: str,
    y: str,
    hue: str | None,
    output_path: str | Path,
    title: str,
    ylabel: str,
) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(8, 5))
    pivot = dataframe.copy()
    if hue is None:
        ax.bar(pivot[x], pivot[y], color="#2c7fb8")
    else:
        hue_values = list(dict.fromkeys(pivot[hue]))
        x_values = list(dict.fromkeys(pivot[x]))
        width = 0.8 / max(len(hue_values), 1)
        positions = np.arange(len(x_values))
        for idx, hue_value in enumerate(hue_values):
            subset = pivot[pivot[hue] == hue_value].set_index(x).reindex(x_values)
            ax.bar(
                positions + (idx - (len(hue_values) - 1) / 2) * width,
                subset[y].to_numpy(),
                width=width,
                label=str(hue_value),
            )
        ax.set_xticks(positions, x_values)
        ax.legend()
    ax.set_title(title)
    ax.set_ylabel(ylabel)
    ax.set_xlabel(x.replace("_", " ").title())
    plt.setp(ax.get_xticklabels(), rotation=20, ha="right")
    fig.tight_layout()
    fig.savefig(output_path, dpi=300)
    plt.close(fig)
