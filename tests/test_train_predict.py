import json

import numpy as np
import pandas as pd
import pytest

from loan_modeling.predict import (
    REQUIRED_FIELDS,
    load_model,
    predict_batch,
    predict_one,
    select_campaign_top_k,
    validate_records,
)
from loan_modeling.train import train_final_artifact


def synthetic_dataset(rows=40):
    records = []
    for i in range(rows):
        positive = i % 4 == 0
        records.append(
            {
                "ID": i + 1,
                "Age": 25 + (i % 35),
                "Experience": -1 if i == 0 else i % 30,
                "Income": 140 + i if positive else 40 + i,
                "ZIPCode": 90000 + i,
                "Family": (i % 4) + 1,
                "CCAvg": 4.5 if positive else 0.8,
                "Education": (i % 3) + 1,
                "Mortgage": 100 if positive else 0,
                "Personal_Loan": int(positive),
                "Securities_Account": i % 2,
                "CD_Account": int(positive),
                "Online": (i + 1) % 2,
                "CreditCard": i % 2,
            }
        )
    return pd.DataFrame(records)


def valid_customer():
    return {
        "Age": 42,
        "Experience": 17,
        "Income": 120,
        "Family": 3,
        "CCAvg": 3.2,
        "Education": 2,
        "Mortgage": 0,
        "Securities_Account": 0,
        "CD_Account": 1,
        "Online": 1,
        "CreditCard": 0,
    }


@pytest.fixture()
def model_bundle(tmp_path):
    data_path = tmp_path / "training.csv"
    model_path = tmp_path / "model.joblib"
    metadata_path = tmp_path / "model_metadata.json"
    synthetic_dataset().to_csv(data_path, index=False)

    metadata = train_final_artifact(
        data_path=data_path,
        model_path=model_path,
        metadata_path=metadata_path,
    )
    bundle = load_model(model_path)

    assert model_path.exists()
    assert metadata_path.exists()
    assert json.loads(metadata_path.read_text())["artifact_format"] == "joblib"
    assert bundle["metadata"]["artifact_version"] == metadata["artifact_version"]
    return bundle


def test_model_artifact_can_be_created_and_loaded(model_bundle):
    assert "pipeline" in model_bundle
    assert "metadata" in model_bundle
    assert hasattr(model_bundle["pipeline"], "predict_proba")
    assert model_bundle["metadata"]["model_type"] == "random_forest"
    assert model_bundle["metadata"]["expected_raw_input_fields"] == REQUIRED_FIELDS


def test_save_load_preserves_predictions(tmp_path):
    data_path = tmp_path / "training.csv"
    model_path = tmp_path / "model.joblib"
    metadata_path = tmp_path / "model_metadata.json"
    synthetic_dataset().to_csv(data_path, index=False)

    train_final_artifact(data_path=data_path, model_path=model_path, metadata_path=metadata_path)
    first = load_model(model_path)
    second = load_model(model_path)

    records = pd.DataFrame([valid_customer(), {**valid_customer(), "Income": 60, "CD_Account": 0}])
    first_scores = first["pipeline"].predict_proba(validate_records(records))[:, 1]
    second_scores = second["pipeline"].predict_proba(validate_records(records))[:, 1]

    assert np.allclose(first_scores, second_scores)


def test_valid_single_customer_prediction_works(model_bundle):
    prediction = predict_one(model_bundle, valid_customer())

    assert 0 <= prediction["predicted_probability"] <= 1
    assert prediction["threshold_prediction"] in {0, 1}
    assert isinstance(prediction["threshold_prediction"], int)


def test_valid_batch_prediction_works(model_bundle):
    records = [valid_customer(), {**valid_customer(), "Income": 65, "CD_Account": 0}]

    predictions = predict_batch(model_bundle, records)

    assert len(predictions) == 2
    assert predictions["predicted_probability"].between(0, 1).all()
    assert set(predictions["threshold_prediction"]).issubset({0, 1})


def test_missing_required_feature_raises_clear_error():
    record = valid_customer()
    del record["Income"]

    with pytest.raises(ValueError, match="missing required field.*Income"):
        validate_records(record)


def test_target_and_excluded_fields_are_rejected():
    with pytest.raises(ValueError, match="forbidden field.*Personal_Loan"):
        validate_records({**valid_customer(), "Personal_Loan": 1})

    with pytest.raises(ValueError, match="forbidden field.*ZIPCode"):
        validate_records({**valid_customer(), "ZIPCode": 94112})


def test_unexpected_fields_are_rejected():
    with pytest.raises(ValueError, match="unexpected field.*Favorite_Color"):
        validate_records({**valid_customer(), "Favorite_Color": "blue"})


def test_invalid_categorical_values_are_rejected():
    with pytest.raises(ValueError, match="invalid Education value.*expected one of 1, 2, 3"):
        validate_records({**valid_customer(), "Education": 4})

    with pytest.raises(ValueError, match="invalid Education value.*expected integer-coded values"):
        validate_records({**valid_customer(), "Education": 1.5})

    with pytest.raises(ValueError, match="invalid Family value.*expected one of 1, 2, 3, 4"):
        validate_records({**valid_customer(), "Family": 5})

    with pytest.raises(ValueError, match="invalid CD_Account value.*expected one of 0, 1"):
        validate_records({**valid_customer(), "CD_Account": 2})


def test_feature_order_does_not_change_predictions(model_bundle):
    customer = valid_customer()
    reversed_customer = dict(reversed(list(customer.items())))

    original = predict_one(model_bundle, customer, include_classification=False)
    reordered = predict_one(model_bundle, reversed_customer, include_classification=False)

    assert original["predicted_probability"] == pytest.approx(reordered["predicted_probability"])


def test_batch_top_k_helper_returns_exact_k(model_bundle):
    records = [
        valid_customer(),
        {**valid_customer(), "Income": 60, "CD_Account": 0},
        {**valid_customer(), "Income": 80, "CCAvg": 1.0},
        {**valid_customer(), "Income": 150, "CCAvg": 5.0},
    ]

    ranked = select_campaign_top_k(model_bundle, records, k_fraction=0.50)

    assert len(ranked) == 4
    assert ranked["selected_for_campaign"].sum() == 2
    assert ranked["predicted_probability"].between(0, 1).all()
