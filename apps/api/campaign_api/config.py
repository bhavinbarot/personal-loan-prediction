from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MODEL_PATH = PROJECT_ROOT / "artifacts" / "model.joblib"
DEFAULT_REPORTS_DIR = PROJECT_ROOT / "reports"
DEFAULT_CORS_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")

MAX_BATCH_SIZE = 2000
DEMO_POPULATION_DEFAULT = 200
DEMO_POPULATION_MIN = 20
DEMO_POPULATION_MAX = 1000
DEMO_POPULATION_SEED = 42


def _split_origins(raw: str | None) -> tuple[str, ...]:
    if not raw:
        return DEFAULT_CORS_ORIGINS
    origins = tuple(origin.strip() for origin in raw.split(",") if origin.strip())
    return origins or DEFAULT_CORS_ORIGINS


@dataclass(frozen=True)
class Settings:
    """Runtime configuration. Values come from environment variables with safe local defaults."""

    model_path: Path = field(default_factory=lambda: Path(os.environ.get("LOAN_MODEL_PATH", DEFAULT_MODEL_PATH)))
    reports_dir: Path = field(default_factory=lambda: Path(os.environ.get("LOAN_REPORTS_DIR", DEFAULT_REPORTS_DIR)))
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: _split_origins(os.environ.get("CORS_ALLOWED_ORIGINS"))
    )
    max_batch_size: int = MAX_BATCH_SIZE
