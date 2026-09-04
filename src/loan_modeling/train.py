from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.model_selection import train_test_split

from loan_modeling.models import RANDOM_STATE, candidate_models
from loan_modeling.preprocessing import DROP_COLUMNS, TARGET, model_input_columns, prepare_raw_features, split_features_target


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "Loan_Modelling.csv"
REPORTS_DIR = PROJECT_ROOT / "reports"
MODEL_SELECTION_PATH = REPORTS_DIR / "tables" / "model_selection_cv.csv"
RUN_SUMMARY_PATH = REPORTS_DIR / "run_summary.json"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"
ARTIFACT_VERSION = "1.0"


def current_git_sha() -> str | None:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            cwd=PROJECT_ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def load_selected_model_config() -> tuple[str, dict, dict]:
    model_selection = pd.read_csv(MODEL_SELECTION_PATH)
    run_summary = json.loads(RUN_SUMMARY_PATH.read_text())

    selected_model = run_summary["selected_model"]
    selected_row = model_selection.loc[model_selection["model"] == selected_model]
    if selected_row.empty:
        raise ValueError(f"Selected model {selected_model!r} was not found in model selection results.")

    best_params = json.loads(selected_row.iloc[0]["best_params"])
    return selected_model, best_params, run_summary


def build_selected_pipeline():
    selected_model, best_params, _ = load_selected_model_config()
    pipeline, _ = candidate_models()[selected_model]
    pipeline.set_params(**best_params)
    return selected_model, best_params, pipeline


def train_final_artifact(
    data_path: Path = DATA_PATH,
    model_path: Path = MODEL_PATH,
    metadata_path: Path = METADATA_PATH,
) -> dict:
    selected_model, best_params, pipeline = build_selected_pipeline()
    run_summary = json.loads(RUN_SUMMARY_PATH.read_text())

    data = pd.read_csv(data_path)
    X, y = split_features_target(data)
    X = prepare_raw_features(X)

    X_train, _, y_train, _ = train_test_split(
        X,
        y,
        test_size=run_summary["split"]["test_size"],
        stratify=y,
        shuffle=True,
        random_state=RANDOM_STATE,
    )
    pipeline.fit(X_train, y_train)

    metadata = {
        "artifact_version": ARTIFACT_VERSION,
        "artifact_format": "joblib",
        "model_type": selected_model,
        "estimator_class": pipeline.named_steps["model"].__class__.__name__,
        "best_params": best_params,
        "expected_raw_input_fields": model_input_columns(),
        "excluded_fields": DROP_COLUMNS + [TARGET],
        "model_selection_metric": run_summary["primary_selection_metric"],
        "random_state": RANDOM_STATE,
        "sklearn_version": sklearn.__version__,
        "training_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "training_data_policy": "trained on the same stratified 80% development split used by the validated holdout workflow",
        "threshold_policy": {
            "type": "probability_threshold",
            "selected_threshold": run_summary["selected_threshold"],
            "description": "Classify/contact records with predicted probability greater than or equal to the threshold.",
        },
        "top_k_policy": {
            "selected_top_k_fraction": run_summary["selected_top_k_fraction"],
            "description": "For fixed campaign capacity, rank by probability descending and break exact ties by stable input order.",
        },
        "git_commit_sha": current_git_sha(),
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    bundle = {"pipeline": pipeline, "metadata": metadata}
    joblib.dump(bundle, model_path)
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n")
    return metadata


def main() -> None:
    metadata = train_final_artifact()
    print(f"Wrote model artifact to {MODEL_PATH.relative_to(PROJECT_ROOT)}")
    print(f"Wrote model metadata to {METADATA_PATH.relative_to(PROJECT_ROOT)}")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
