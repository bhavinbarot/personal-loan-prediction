import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from loan_modeling.models import candidate_models
from loan_modeling.preprocessing import prepare_raw_features, split_features_target


def synthetic_training_data():
    rows = []
    for i in range(24):
        positive = i % 4 == 0
        rows.append(
            {
                "ID": i + 1,
                "Age": 25 + (i % 30),
                "Experience": -1 if i == 0 else max(0, i % 25),
                "Income": 130 + i if positive else 35 + i,
                "ZIPCode": 90000 + i,
                "Family": (i % 4) + 1,
                "CCAvg": 4.0 + (i / 10) if positive else 0.5 + (i / 20),
                "Education": (i % 3) + 1,
                "Mortgage": 100 if positive else 0,
                "Personal_Loan": int(positive),
                "Securities_Account": i % 2,
                "CD_Account": int(positive),
                "Online": (i + 1) % 2,
                "CreditCard": i % 2,
            }
        )
    return pd.DataFrame(rows)


def test_candidate_models_are_project_pipelines_with_predict_proba():
    models = candidate_models()

    assert set(models) == {
        "dummy_most_frequent",
        "logistic_regression",
        "decision_tree",
        "random_forest",
        "gradient_boosting",
    }
    for pipeline, param_grid in models.values():
        assert isinstance(pipeline, Pipeline)
        assert "preprocess" in pipeline.named_steps
        assert "model" in pipeline.named_steps
        assert hasattr(pipeline.named_steps["model"], "predict_proba")
        assert isinstance(param_grid, dict)


def test_candidate_model_pipelines_fit_and_predict_probabilities_quickly():
    data = synthetic_training_data()
    X, y = split_features_target(data)
    X = prepare_raw_features(X)

    for name, (pipeline, _) in candidate_models().items():
        pipeline.set_params(**small_model_params(name))
        pipeline.fit(X, y)

        probabilities = pipeline.predict_proba(X)[:, 1]
        predictions = pipeline.predict(X)

        assert len(probabilities) == len(X)
        assert len(predictions) == len(X)
        assert np.all(probabilities >= 0)
        assert np.all(probabilities <= 1)


def test_model_pipelines_accept_expected_schema_without_id_zip_or_target():
    data = synthetic_training_data()
    X, y = split_features_target(data)
    X = prepare_raw_features(X)
    pipeline, _ = candidate_models()["logistic_regression"]

    pipeline.fit(X, y)
    probabilities = pipeline.predict_proba(X.iloc[[0, 1]])[:, 1]

    assert list(X.columns) == [
        "Age",
        "Experience",
        "Income",
        "Family",
        "CCAvg",
        "Education",
        "Mortgage",
        "Securities_Account",
        "CD_Account",
        "Online",
        "CreditCard",
    ]
    assert probabilities.shape == (2,)


def small_model_params(name):
    if name == "random_forest":
        return {"model__n_estimators": 10, "model__n_jobs": 1}
    if name == "gradient_boosting":
        return {"model__n_estimators": 10}
    return {}

