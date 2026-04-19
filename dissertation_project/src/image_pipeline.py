from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from copy import deepcopy
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
    prediction_frame: pd.DataFrame | None = None


def build_transforms(
    image_size=(224, 224),
    *,
    normalization: str = "breakhis",
    augment: bool = True,
):
    if normalization == "breakhis":
        mean, std = BREAKHIS_MEAN, BREAKHIS_STD
    elif normalization == "imagenet":
        mean, std = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]
    else:
        raise ValueError("normalization must be 'breakhis' or 'imagenet'")

    train_steps = [transforms.Resize(image_size)]
    if augment:
        train_steps.extend(
            [
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(10),
            ]
        )
    train_steps.extend([transforms.ToTensor(), transforms.Normalize(mean=mean, std=std)])
    train_transform = transforms.Compose(train_steps)
    eval_transform = transforms.Compose(
        [
            transforms.Resize(image_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=mean, std=std),
        ]
    )
    return train_transform, eval_transform


def create_dataloaders(
    train_df,
    val_df,
    test_df,
    *,
    batch_size=32,
    image_size=(224, 224),
    normalization: str = "breakhis",
    augment: bool = True,
):
    train_transform, eval_transform = build_transforms(
        image_size=image_size,
        normalization=normalization,
        augment=augment,
    )
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


def predict_dataframe(
    model: nn.Module,
    dataframe: pd.DataFrame,
    *,
    batch_size: int = 32,
    device: str | torch.device | None = None,
    normalization: str = "breakhis",
) -> pd.DataFrame:
    device = torch.device(device) if device is not None else resolve_device()
    _, eval_transform = build_transforms(normalization=normalization, augment=False)
    dataset = BreakHisDataset(dataframe, transform=eval_transform)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    model = model.to(device)
    model.eval()

    rows: list[dict[str, object]] = []
    cursor = 0
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)[:, 1].cpu().numpy()
            preds = (probs >= 0.5).astype(int)
            batch_frame = dataframe.iloc[cursor : cursor + len(images)].reset_index(drop=True)
            cursor += len(images)
            for idx in range(len(batch_frame)):
                rows.append(
                    {
                        "filepath": batch_frame.loc[idx, "filepath"],
                        "patient_id": batch_frame.loc[idx, "patient_id"],
                        "label": batch_frame.loc[idx, "label"],
                        "magnification": batch_frame.loc[idx, "magnification"],
                        "y_true": int(labels[idx].item()),
                        "y_pred": int(preds[idx]),
                        "y_prob": float(probs[idx]),
                    }
                )
    return pd.DataFrame(rows)


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
    normalization: str = "breakhis",
    augment: bool = True,
    save_path: str | Path | None = None,
) -> TrainingArtifacts:
    device = torch.device(device) if device is not None else resolve_device()
    loaders = create_dataloaders(
        train_df,
        val_df,
        test_df,
        batch_size=batch_size,
        normalization=normalization,
        augment=augment,
    )
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
    best_val_accuracy = float("-inf")
    best_state_dict = None
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
        if val_acc > best_val_accuracy:
            best_val_accuracy = val_acc
            best_state_dict = deepcopy(model.state_dict())

    if best_state_dict is not None:
        model.load_state_dict(best_state_dict)

    test_loss, test_acc, y_true, y_pred, y_prob = _evaluate(model, loaders["test"], criterion, device)
    metrics = classification_metrics(y_true, y_pred, y_prob)
    metrics["test_loss"] = test_loss
    metrics["best_val_accuracy"] = best_val_accuracy
    prediction_frame = predict_dataframe(
        model,
        test_df.reset_index(drop=True),
        batch_size=batch_size,
        device=device,
        normalization=normalization,
    )
    if save_path is not None:
        save_path = Path(save_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        torch.save(model.state_dict(), save_path)
    return TrainingArtifacts(
        model=model,
        history=pd.DataFrame(history_rows),
        metrics=metrics,
        y_true=y_true,
        y_pred=y_pred,
        y_prob=y_prob,
        prediction_frame=prediction_frame,
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
