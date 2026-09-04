from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

from campaign_api.errors import ReportsUnavailableError


MODEL_LABELS = {
    "random_forest": "Random Forest",
    "gradient_boosting": "Gradient Boosting",
    "decision_tree": "Decision Tree",
    "logistic_regression": "Logistic Regression",
    "dummy_most_frequent": "Dummy Baseline",
}

CV_METRICS = ["average_precision", "roc_auc", "f1", "precision", "recall", "accuracy", "balanced_accuracy"]


def _label(model: str) -> str:
    return MODEL_LABELS.get(model, model.replace("_", " ").title())


@lru_cache(maxsize=4)
def load_validation_report(reports_dir: Path) -> dict[str, Any]:
    """Read the tracked evaluation outputs and shape them for the frontend.

    Nothing is recomputed here: every number comes from the report files
    written by `loan_modeling.evaluate`.
    """
    tables = Path(reports_dir) / "tables"
    try:
        summary = json.loads((Path(reports_dir) / "run_summary.json").read_text())
        selection = pd.read_csv(tables / "model_selection_cv.csv")
        holdout = pd.read_csv(tables / "final_holdout_metrics.csv").iloc[0]
        campaign = pd.read_csv(tables / "final_holdout_campaign_metrics.csv")
        confusion = pd.read_csv(tables / "final_holdout_confusion_matrix.csv", index_col=0)
    except (FileNotFoundError, KeyError, IndexError, ValueError) as exc:
        raise ReportsUnavailableError(f"validation reports could not be read: {exc.__class__.__name__}") from exc

    selected_model = summary["selected_model"]

    model_selection = []
    for _, row in selection.iterrows():
        entry: dict[str, Any] = {
            "model": row["model"],
            "label": _label(row["model"]),
            "selected": row["model"] == selected_model,
            "best_params": json.loads(row["best_params"]) if isinstance(row["best_params"], str) else {},
        }
        for metric in CV_METRICS:
            entry[f"mean_cv_{metric}"] = float(row[f"mean_cv_{metric}"])
            entry[f"std_cv_{metric}"] = float(row[f"std_cv_{metric}"])
        model_selection.append(entry)
    model_selection.sort(key=lambda item: item["mean_cv_average_precision"], reverse=True)

    tn = int(confusion.loc["actual_0", "predicted_0"])
    fp = int(confusion.loc["actual_0", "predicted_1"])
    fn = int(confusion.loc["actual_1", "predicted_0"])
    tp = int(confusion.loc["actual_1", "predicted_1"])

    campaign_rows = [
        {
            "capacity": float(row["top_k_fraction"]),
            "customers_contacted": int(row["customers_contacted"]),
            "responders_captured": int(row["responders_captured"]),
            "precision_at_k": float(row["precision_at_k"]),
            "recall_at_k": float(row["recall_at_k"]),
            "lift_at_k": float(row["lift_at_k"]),
            "number_needed_to_contact": float(row["number_needed_to_contact"]),
        }
        for _, row in campaign.iterrows()
    ]

    return {
        "dataset": {
            "rows": int(summary["rows"]),
            "positive_count": int(summary["positive_count"]),
            "positive_rate": float(summary["positive_rate"]),
            "development_rows": int(summary["split"]["train_rows"]),
            "holdout_rows": int(summary["split"]["test_rows"]),
            "holdout_fraction": float(summary["split"]["test_size"]),
            "holdout_responders": tp + fn,
            "stratified": bool(summary["split"]["stratified"]),
        },
        "cross_validation": {
            "type": summary["cv"]["type"],
            "n_splits": int(summary["cv"]["n_splits"]),
            "shuffle": bool(summary["cv"]["shuffle"]),
        },
        "selection": {
            "primary_metric": summary["primary_selection_metric"],
            "selected_model": selected_model,
            "selected_model_label": _label(selected_model),
            "threshold_source": summary["selected_threshold_source"],
            "selected_threshold": float(summary["selected_threshold"]),
            "selected_top_k_fraction": float(summary["selected_top_k_fraction"]),
        },
        "model_selection": model_selection,
        "holdout": {
            "model": holdout["model"],
            "threshold": float(holdout["selected_threshold"]),
            "accuracy": float(holdout["accuracy"]),
            "balanced_accuracy": float(holdout["balanced_accuracy"]),
            "precision": float(holdout["precision"]),
            "recall": float(holdout["recall"]),
            "f1": float(holdout["f1"]),
            "roc_auc": float(holdout["roc_auc"]),
            "average_precision": float(holdout["average_precision"]),
        },
        "confusion_matrix": {
            "threshold": float(holdout["selected_threshold"]),
            "correctly_excluded": tn,
            "false_outreach": fp,
            "missed_responders": fn,
            "captured_responders": tp,
            "raw": {
                "actual_0": {"predicted_0": tn, "predicted_1": fp},
                "actual_1": {"predicted_0": fn, "predicted_1": tp},
            },
        },
        "campaign": campaign_rows,
    }
