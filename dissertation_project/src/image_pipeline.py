from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from PIL import Image
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

from .metrics import classification_metrics


BREAKHIS_MEAN = [0.79265212, 0.62774458, 0.76449277]
BREAKHIS_STD = [0.10090955, 0.13664410, 0.08862125]


class BreakHisDataset(Dataset):
    label_map = {"benign": 0, "malignant": 1}

    def __init__(self, dataframe: pd.DataFrame, transform=None):
        self.dataframe = dataframe.reset_index(drop=True)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.dataframe)

    def __getitem__(self, idx: int):
        row = self.dataframe.iloc[idx]
        with Image.open(row["filepath"]) as image:
            image = image.convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, self.label_map[row["label"]]


@dataclass
class TrainingArtifacts:
    model: nn.Module
    history: pd.DataFrame
    metrics: dict[str, float]
    y_true: list[int]
    y_pred: list[int]
    y_prob: list[float]


def build_transforms(image_size=(224, 224)):
    train_transform = transforms.Compose(
        [
            transforms.Resize(image_size),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(10),
            transforms.ToTensor(),
            transforms.Normalize(mean=BREAKHIS_MEAN, std=BREAKHIS_STD),
        ]
    )
    eval_transform = transforms.Compose(
        [
            transforms.Resize(image_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=BREAKHIS_MEAN, std=BREAKHIS_STD),
        ]
    )
    return train_transform, eval_transform


def create_dataloaders(train_df, val_df, test_df, batch_size=32):
    train_transform, eval_transform = build_transforms()
    train_dataset = BreakHisDataset(train_df, transform=train_transform)
    val_dataset = BreakHisDataset(val_df, transform=eval_transform)
    test_dataset = BreakHisDataset(test_df, transform=eval_transform)
    return {
        "train": DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0),
        "val": DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0),
        "test": DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0),
    }


def resolve_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def build_resnet18(
    device: torch.device,
    *,
    weights="default",
    checkpoint_path: str | Path | None = None,
    freeze_backbone: bool = False,
) -> nn.Module:
    if checkpoint_path is not None:
        model = models.resnet18(weights=None)
    elif weights == "default":
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    else:
        model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 2)
    if checkpoint_path is not None:
        state_dict = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(state_dict)
    if freeze_backbone:
        for name, param in model.named_parameters():
            param.requires_grad = name.startswith("fc.")
    return model.to(device)


def _run_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    all_preds: list[int] = []
    all_labels: list[int] = []
    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item() * images.size(0)
        preds = torch.argmax(outputs, dim=1)
        all_preds.extend(preds.detach().cpu().numpy().tolist())
        all_labels.extend(labels.detach().cpu().numpy().tolist())
    loss = running_loss / len(loader.dataset)
    acc = (np.array(all_preds) == np.array(all_labels)).mean()
    return loss, acc


def _evaluate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    all_preds: list[int] = []
    all_labels: list[int] = []
    all_probs: list[float] = []
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)[:, 1]
            loss = criterion(outputs, labels)
            running_loss += loss.item() * images.size(0)
            preds = torch.argmax(outputs, dim=1)
            all_preds.extend(preds.detach().cpu().numpy().tolist())
            all_labels.extend(labels.detach().cpu().numpy().tolist())
            all_probs.extend(probs.detach().cpu().numpy().tolist())
    loss = running_loss / len(loader.dataset)
    acc = (np.array(all_preds) == np.array(all_labels)).mean()
    return loss, acc, all_labels, all_preds, all_probs


def train_breakhis_baseline(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    *,
    epochs: int = 5,
    learning_rate: float = 1e-4,
    batch_size: int = 32,
    checkpoint_path: str | Path | None = None,
    weights="default",
    device: str | torch.device | None = None,
    freeze_backbone: bool = False,
) -> TrainingArtifacts:
    device = torch.device(device) if device is not None else resolve_device()
    loaders = create_dataloaders(train_df, val_df, test_df, batch_size=batch_size)
    model = build_resnet18(
        device,
        weights=weights,
        checkpoint_path=checkpoint_path,
        freeze_backbone=freeze_backbone,
    )
    criterion = nn.CrossEntropyLoss()
    trainable_params = [param for param in model.parameters() if param.requires_grad]
    optimizer = torch.optim.Adam(trainable_params, lr=learning_rate)

    history_rows = []
    for epoch in range(1, epochs + 1):
        train_loss, train_acc = _run_epoch(model, loaders["train"], criterion, optimizer, device)
        val_loss, val_acc, _, _, _ = _evaluate(model, loaders["val"], criterion, device)
        history_rows.append(
            {
                "epoch": epoch,
                "train_loss": train_loss,
                "train_accuracy": train_acc,
                "val_loss": val_loss,
                "val_accuracy": val_acc,
            }
        )

    test_loss, test_acc, y_true, y_pred, y_prob = _evaluate(model, loaders["test"], criterion, device)
    metrics = classification_metrics(y_true, y_pred, y_prob)
    metrics["test_loss"] = test_loss
    return TrainingArtifacts(
        model=model,
        history=pd.DataFrame(history_rows),
        metrics=metrics,
        y_true=y_true,
        y_pred=y_pred,
        y_prob=y_prob,
    )


def save_history_plot(history: pd.DataFrame, output_path: str | Path) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    axes[0].plot(history["epoch"], history["train_loss"], label="train")
    axes[0].plot(history["epoch"], history["val_loss"], label="val")
    axes[0].set_title("Loss")
    axes[0].set_xlabel("Epoch")
    axes[0].legend()

    axes[1].plot(history["epoch"], history["train_accuracy"], label="train")
    axes[1].plot(history["epoch"], history["val_accuracy"], label="val")
    axes[1].set_title("Accuracy")
    axes[1].set_xlabel("Epoch")
    axes[1].legend()

    fig.tight_layout()
    fig.savefig(output_path, dpi=300)
    plt.close(fig)
