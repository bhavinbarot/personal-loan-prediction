from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from loan_modeling.metrics import select_top_k_mask
from loan_modeling.preprocessing import BINARY_FEATURES, CATEGORICAL_FEATURES, TARGET, model_input_columns
from loan_modeling.train import MODEL_PATH


REQUIRED_FIELDS = model_input_columns()
FORBIDDEN_FIELDS = {TARGET, "ID", "ZIPCode"}
EDUCATION_VALUES = {1, 2, 3}
FAMILY_VALUES = {1, 2, 3, 4}
BINARY_VALUES = {0, 1}


def load_model(path: str | Path = MODEL_PATH) -> dict[str, Any]:
    bundle = joblib.load(path)
    if not isinstance(bundle, dict) or "pipeline" not in bundle or "metadata" not in bundle:
        raise ValueError("Model artifact must be a bundle containing 'pipeline' and 'metadata'.")
    if not hasattr(bundle["pipeline"], "predict_proba"):
        raise ValueError("Loaded pipeline does not support predict_proba.")
    return bundle


def validate_records(records: dict[str, Any] | list[dict[str, Any]] | pd.DataFrame) -> pd.DataFrame:
    frame = _as_frame(records)
    columns = set(frame.columns)

    forbidden = sorted(columns & FORBIDDEN_FIELDS)
    if forbidden:
        raise ValueError(f"forbidden field(s): {', '.join(forbidden)}")

    required = set(REQUIRED_FIELDS)
    missing = sorted(required - columns)
    if missing:
        raise ValueError(f"missing required field(s): {', '.join(missing)}")

    unexpected = sorted(columns - required)
    if unexpected:
        raise ValueError(f"unexpected field(s): {', '.join(unexpected)}")

    _validate_allowed_values(frame, "Education", EDUCATION_VALUES)
    _validate_allowed_values(frame, "Family", FAMILY_VALUES)
    for field in BINARY_FEATURES:
        _validate_allowed_values(frame, field, BINARY_VALUES)

    return frame.loc[:, REQUIRED_FIELDS].copy()


def predict_batch(
    model_bundle: dict[str, Any],
    records: dict[str, Any] | list[dict[str, Any]] | pd.DataFrame,
    include_classification: bool = True,
) -> pd.DataFrame:
    frame = validate_records(records)
    probabilities = model_bundle["pipeline"].predict_proba(frame)[:, 1]

    result = pd.DataFrame({"predicted_probability": probabilities})
    if include_classification:
        threshold = model_bundle["metadata"]["threshold_policy"]["selected_threshold"]
        result["threshold_prediction"] = (probabilities >= threshold).astype(int)
    return result


def predict_one(
    model_bundle: dict[str, Any],
    record: dict[str, Any],
    include_classification: bool = True,
) -> dict[str, float | int]:
    result = predict_batch(model_bundle, record, include_classification=include_classification).iloc[0]
    output: dict[str, float | int] = {"predicted_probability": float(result["predicted_probability"])}
    if include_classification:
        output["threshold_prediction"] = int(result["threshold_prediction"])
    return output


def select_campaign_top_k(
    model_bundle: dict[str, Any],
    records: list[dict[str, Any]] | pd.DataFrame,
    k_fraction: float | None = None,
) -> pd.DataFrame:
    predictions = predict_batch(model_bundle, records, include_classification=False)
    if k_fraction is None:
        k_fraction = model_bundle["metadata"]["top_k_policy"]["selected_top_k_fraction"]

    selected = select_top_k_mask(predictions["predicted_probability"].to_numpy(), k_fraction)
    ranked = predictions.copy()
    ranked["selected_for_campaign"] = selected
    return ranked


def _as_frame(records: dict[str, Any] | list[dict[str, Any]] | pd.DataFrame) -> pd.DataFrame:
    if isinstance(records, pd.DataFrame):
        return records.copy()
    if isinstance(records, dict):
        return pd.DataFrame([records])
    if isinstance(records, list) and all(isinstance(row, dict) for row in records):
        return pd.DataFrame(records)
    raise TypeError("records must be a dict, list of dicts, or pandas DataFrame.")


def _validate_allowed_values(frame: pd.DataFrame, field: str, allowed: set[int]) -> None:
    values = pd.to_numeric(frame[field], errors="coerce")
    non_integer = values.dropna() % 1 != 0
    if non_integer.any():
        invalid_values = ", ".join(str(value) for value in sorted(values.dropna()[non_integer].unique()))
        raise ValueError(f"invalid {field} value(s): {invalid_values}; expected integer-coded values")

    observed = set(values.dropna().astype(int))
    invalid = sorted(observed - allowed)
    if invalid:
        allowed_values = ", ".join(str(value) for value in sorted(allowed))
        invalid_values = ", ".join(str(value) for value in invalid)
        raise ValueError(f"invalid {field} value(s): {invalid_values}; expected one of {allowed_values}")
