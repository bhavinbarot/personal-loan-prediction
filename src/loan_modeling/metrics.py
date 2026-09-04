from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def classification_metrics(y_true, y_score, threshold: float) -> dict[str, float]:
    y_pred = (np.asarray(y_score) >= threshold).astype(int)
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_true, y_score),
        "average_precision": average_precision_score(y_true, y_score),
    }


def threshold_for_top_k(y_score, k_fraction: float) -> float:
    scores = np.asarray(y_score)
    if not 0 < k_fraction < 1:
        raise ValueError("k_fraction must be between 0 and 1.")
    contact_count = max(1, int(np.ceil(len(scores) * k_fraction)))
    cutoff_index = np.argsort(scores)[-contact_count]
    return float(scores[cutoff_index])


def campaign_metrics(y_true, y_score, k_values=(0.05, 0.10, 0.20)) -> pd.DataFrame:
    y_true = np.asarray(y_true)
    y_score = np.asarray(y_score)
    base_rate = y_true.mean()
    rows = []
    order = np.argsort(-y_score)

    for k in k_values:
        n_contact = max(1, int(np.ceil(len(y_true) * k)))
        selected = order[:n_contact]
        positives_found = int(y_true[selected].sum())
        precision_at_k = positives_found / n_contact
        recall_at_k = positives_found / y_true.sum()
        rows.append(
            {
                "top_k_fraction": k,
                "customers_contacted": n_contact,
                "responders_captured": positives_found,
                "precision_at_k": precision_at_k,
                "recall_at_k": recall_at_k,
                "lift_at_k": precision_at_k / base_rate if base_rate else np.nan,
                "number_needed_to_contact": 1 / precision_at_k if precision_at_k else np.inf,
            }
        )

    return pd.DataFrame(rows)


def confusion_matrix_frame(y_true, y_score, threshold: float) -> pd.DataFrame:
    y_pred = (np.asarray(y_score) >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    return pd.DataFrame(cm, index=["actual_0", "actual_1"], columns=["predicted_0", "predicted_1"])

