from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

from loan_modeling.predict import load_model, predict_batch, predict_one, select_campaign_top_k

from campaign_api.errors import ModelUnavailableError
from campaign_api.logging_config import Timer, log_event


logger = logging.getLogger(__name__)


class ModelService:
    """Thin wrapper around the validated loan_modeling inference functions.

    The service owns artifact loading and translates results into plain Python
    structures. All scoring, validation, and exact top-K logic stays inside
    loan_modeling.
    """

    def __init__(self, model_path: Path):
        self.model_path = Path(model_path)
        self._bundle: dict[str, Any] | None = None
        self.load_error: str | None = None

    def load(self) -> bool:
        timer = Timer()
        log_event(logger, "model_load_started")
        try:
            self._bundle = load_model(self.model_path)
            self.load_error = None
            meta = self.metadata
            log_event(
                logger,
                "model_loaded",
                model_type=meta.get("model_type"),
                artifact_version=meta.get("artifact_version"),
                sklearn_version=meta.get("sklearn_version"),
                duration_ms=timer.elapsed_ms(),
            )
            return True
        except FileNotFoundError:
            self._bundle = None
            self.load_error = "artifact_missing"
            # The configured path is deliberately not logged or exposed.
            log_event(logger, "model_load_failed", level=logging.WARNING, reason="artifact_missing")
        except Exception as exc:  # noqa: BLE001 - surface any artifact problem as unavailable
            self._bundle = None
            self.load_error = "artifact_invalid"
            log_event(logger, "model_load_failed", level=logging.ERROR, reason="artifact_invalid", error_type=exc.__class__.__name__)
        return False

    @property
    def is_loaded(self) -> bool:
        return self._bundle is not None

    @property
    def bundle(self) -> dict[str, Any]:
        if self._bundle is None:
            raise ModelUnavailableError()
        return self._bundle

    @property
    def metadata(self) -> dict[str, Any]:
        return self.bundle["metadata"]

    @property
    def threshold(self) -> float:
        return float(self.metadata["threshold_policy"]["selected_threshold"])

    def predict_one(self, record: dict[str, Any]) -> dict[str, Any]:
        result = predict_one(self.bundle, record)
        probability = float(result["predicted_probability"])
        above = bool(result["threshold_prediction"])
        return {
            "response_probability": probability,
            "above_threshold": above,
            "outreach_priority": "higher" if above else "lower",
            "threshold": self.threshold,
        }

    def predict_many(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        frame = predict_batch(self.bundle, records)
        return [
            {
                "index": int(index),
                "response_probability": float(row["predicted_probability"]),
                "outreach_priority": "higher" if int(row["threshold_prediction"]) else "lower",
            }
            for index, row in frame.iterrows()
        ]

    def rank_campaign(self, records: list[dict[str, Any]], capacity: float) -> list[dict[str, Any]]:
        ranked: pd.DataFrame = select_campaign_top_k(self.bundle, records, k_fraction=capacity)
        ranked = ranked.reset_index().rename(columns={"index": "original_index"})
        # Stable descending sort matches the tie-breaking used by select_top_k_mask (score desc, input order).
        ordered = ranked.sort_values("predicted_probability", ascending=False, kind="stable").reset_index(drop=True)
        return [
            {
                "rank": int(position + 1),
                "index": int(row["original_index"]),
                "response_probability": float(row["predicted_probability"]),
                "selected": bool(row["selected_for_campaign"]),
            }
            for position, row in ordered.iterrows()
        ]
