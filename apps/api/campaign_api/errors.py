from __future__ import annotations


class ModelUnavailableError(RuntimeError):
    """Raised when the trained model artifact cannot be loaded."""


class ReportsUnavailableError(RuntimeError):
    """Raised when curated validation reports cannot be read."""


MODEL_UNAVAILABLE_MESSAGE = (
    "The trained model artifact is not available. Generate it locally with "
    "`PYTHONPATH=src python3 -m loan_modeling.train` (requires the local training dataset), "
    "or point LOAN_MODEL_PATH at an existing artifact."
)
