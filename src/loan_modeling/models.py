from __future__ import annotations

from sklearn.dummy import DummyClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier

from loan_modeling.preprocessing import make_preprocessor


RANDOM_STATE = 42


def candidate_models() -> dict[str, tuple[Pipeline, dict]]:
    return {
        "dummy_most_frequent": (
            Pipeline(
                steps=[
                    ("preprocess", make_preprocessor(scale_numeric=False)),
                    ("model", DummyClassifier(strategy="most_frequent")),
                ]
            ),
            {},
        ),
        "logistic_regression": (
            Pipeline(
                steps=[
                    ("preprocess", make_preprocessor(scale_numeric=True)),
                    (
                        "model",
                        LogisticRegression(
                            solver="liblinear",
                            max_iter=1000,
                            random_state=RANDOM_STATE,
                        ),
                    ),
                ]
            ),
            {
                "model__C": [0.1, 1.0, 10.0],
                "model__class_weight": [None, "balanced"],
            },
        ),
        "decision_tree": (
            Pipeline(
                steps=[
                    ("preprocess", make_preprocessor(scale_numeric=False)),
                    ("model", DecisionTreeClassifier(random_state=RANDOM_STATE)),
                ]
            ),
            {
                "model__max_depth": [2, 3, 4, 5, None],
                "model__min_samples_leaf": [1, 5, 10, 20],
                "model__min_samples_split": [2, 10, 25],
                "model__ccp_alpha": [0.0, 0.0005, 0.001, 0.0025, 0.005],
                "model__class_weight": [None, "balanced"],
            },
        ),
        "random_forest": (
            Pipeline(
                steps=[
                    ("preprocess", make_preprocessor(scale_numeric=False)),
                    (
                        "model",
                        RandomForestClassifier(
                            n_estimators=300,
                            random_state=RANDOM_STATE,
                            n_jobs=-1,
                        ),
                    ),
                ]
            ),
            {
                "model__max_depth": [3, 5, None],
                "model__min_samples_leaf": [1, 5, 10],
                "model__max_features": ["sqrt", None],
                "model__class_weight": [None, "balanced"],
            },
        ),
        "gradient_boosting": (
            Pipeline(
                steps=[
                    ("preprocess", make_preprocessor(scale_numeric=False)),
                    ("model", GradientBoostingClassifier(random_state=RANDOM_STATE)),
                ]
            ),
            {
                "model__n_estimators": [100, 200],
                "model__learning_rate": [0.03, 0.1],
                "model__max_depth": [2, 3],
                "model__min_samples_leaf": [1, 10],
            },
        ),
    }

