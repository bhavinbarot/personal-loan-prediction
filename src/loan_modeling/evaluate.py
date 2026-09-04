from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from sklearn.metrics import make_scorer, precision_score, recall_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_predict, train_test_split

from loan_modeling.metrics import (
    campaign_metrics,
    classification_metrics,
    confusion_matrix_frame,
    threshold_for_top_k,
)
from loan_modeling.models import RANDOM_STATE, candidate_models
from loan_modeling.preprocessing import prepare_raw_features, split_features_target


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "Loan_Modelling.csv"
REPORTS_DIR = PROJECT_ROOT / "reports"
TABLES_DIR = REPORTS_DIR / "tables"
MODEL_SELECTION_PATH = TABLES_DIR / "model_selection_cv.csv"
FINAL_METRICS_PATH = TABLES_DIR / "final_holdout_metrics.csv"
FINAL_CAMPAIGN_PATH = TABLES_DIR / "final_holdout_campaign_metrics.csv"
FINAL_CONFUSION_PATH = TABLES_DIR / "final_holdout_confusion_matrix.csv"
RUN_SUMMARY_PATH = REPORTS_DIR / "run_summary.json"


SCORING = {
    "average_precision": "average_precision",
    "roc_auc": "roc_auc",
    "f1": "f1",
    "precision": make_scorer(precision_score, zero_division=0),
    "recall": make_scorer(recall_score, zero_division=0),
    "accuracy": "accuracy",
    "balanced_accuracy": "balanced_accuracy",
}


def main() -> None:
    TABLES_DIR.mkdir(parents=True, exist_ok=True)

    data = pd.read_csv(DATA_PATH)
    X, y = split_features_target(data)
    X = prepare_raw_features(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        stratify=y,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    model_rows = []
    searches = {}

    for name, (pipeline, param_grid) in candidate_models().items():
        search = GridSearchCV(
            estimator=pipeline,
            param_grid=param_grid,
            scoring=SCORING,
            refit="average_precision",
            cv=cv,
            n_jobs=-1,
            return_train_score=False,
        )
        search.fit(X_train, y_train)
        searches[name] = search
        best_idx = search.best_index_
        row = {
            "model": name,
            "best_params": json.dumps(search.best_params_, sort_keys=True),
            "rank_average_precision": int(search.cv_results_["rank_test_average_precision"][best_idx]),
        }
        for metric in SCORING:
            row[f"mean_cv_{metric}"] = search.cv_results_[f"mean_test_{metric}"][best_idx]
            row[f"std_cv_{metric}"] = search.cv_results_[f"std_test_{metric}"][best_idx]
        model_rows.append(row)

    model_selection = pd.DataFrame(model_rows).sort_values(
        ["mean_cv_average_precision", "mean_cv_f1"], ascending=False
    )
    model_selection.to_csv(MODEL_SELECTION_PATH, index=False)

    best_model_name = model_selection.iloc[0]["model"]
    best_search = searches[best_model_name]
    best_estimator = best_search.best_estimator_

    oof_scores = cross_val_predict(
        best_estimator,
        X_train,
        y_train,
        cv=cv,
        method="predict_proba",
        n_jobs=-1,
    )[:, 1]
    selected_top_k = 0.10
    selected_threshold = threshold_for_top_k(oof_scores, selected_top_k)

    best_estimator.fit(X_train, y_train)
    test_scores = best_estimator.predict_proba(X_test)[:, 1]

    final_metrics = pd.DataFrame(
        [
            {
                "model": best_model_name,
                "selected_top_k_fraction": selected_top_k,
                "selected_threshold": selected_threshold,
                **classification_metrics(y_test, test_scores, selected_threshold),
            }
        ]
    )
    final_metrics.to_csv(FINAL_METRICS_PATH, index=False)
    campaign_metrics(y_test, test_scores).to_csv(FINAL_CAMPAIGN_PATH, index=False)
    confusion_matrix_frame(y_test, test_scores, selected_threshold).to_csv(FINAL_CONFUSION_PATH)

    summary = {
        "data_path": str(DATA_PATH.name),
        "rows": int(len(data)),
        "positive_count": int(y.sum()),
        "positive_rate": float(y.mean()),
        "split": {
            "train_rows": int(len(X_train)),
            "test_rows": int(len(X_test)),
            "test_size": 0.20,
            "stratified": True,
            "random_state": RANDOM_STATE,
        },
        "cv": {
            "type": "StratifiedKFold",
            "n_splits": 5,
            "shuffle": True,
            "random_state": RANDOM_STATE,
        },
        "primary_selection_metric": "average_precision",
        "selected_model": best_model_name,
        "selected_threshold_source": "5-fold out-of-fold training probabilities",
        "selected_top_k_fraction": selected_top_k,
        "selected_threshold": selected_threshold,
        "outputs": {
            "model_selection": str(MODEL_SELECTION_PATH.relative_to(PROJECT_ROOT)),
            "final_metrics": str(FINAL_METRICS_PATH.relative_to(PROJECT_ROOT)),
            "final_campaign_metrics": str(FINAL_CAMPAIGN_PATH.relative_to(PROJECT_ROOT)),
            "final_confusion_matrix": str(FINAL_CONFUSION_PATH.relative_to(PROJECT_ROOT)),
        },
    }
    RUN_SUMMARY_PATH.write_text(json.dumps(summary, indent=2) + "\n")

    print(model_selection.to_string(index=False))
    print()
    print(final_metrics.to_string(index=False))
    print(f"\nWrote reports to {REPORTS_DIR}")


if __name__ == "__main__":
    main()

