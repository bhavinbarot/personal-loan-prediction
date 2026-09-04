"""Behaviour beyond the happy path: broken artifacts, bad inputs, and empty populations."""

from fastapi.testclient import TestClient

from campaign_api.config import PROJECT_ROOT, Settings
from campaign_api.main import create_app

from .conftest import valid_features


def _client_with_artifact(path):
    app = create_app(Settings(model_path=path, reports_dir=PROJECT_ROOT / "reports"))
    return TestClient(app, raise_server_exceptions=False)


def test_corrupt_artifact_is_reported_as_not_ready_without_details(tmp_path, caplog):
    import logging

    caplog.set_level(logging.ERROR)
    corrupt = tmp_path / "model.joblib"
    corrupt.write_bytes(b"this is not a joblib bundle")

    with _client_with_artifact(corrupt) as client:
        ready = client.get("/ready")
        predict = client.post("/predict", json={"features": valid_features()})

    assert ready.status_code == 503
    assert ready.json() == {"status": "not_ready", "model_loaded": False, "reason": "artifact_invalid"}
    assert predict.status_code == 503
    assert predict.json()["error"]["code"] == "MODEL_UNAVAILABLE"
    assert str(tmp_path) not in predict.text
    assert "Traceback" not in predict.text

    failed = next(r for r in caplog.records if getattr(r, "event", None) == "model_load_failed")
    assert failed.reason == "artifact_invalid"
    assert failed.error_type
    assert str(tmp_path) not in str(failed.__dict__)


def test_wrong_bundle_shape_is_treated_as_invalid_artifact(tmp_path):
    import joblib

    bad = tmp_path / "model.joblib"
    joblib.dump({"not": "a bundle"}, bad)

    with _client_with_artifact(bad) as client:
        assert client.get("/ready").json()["reason"] == "artifact_invalid"
        assert client.get("/metadata").json()["model_loaded"] is False


def test_empty_campaign_population_is_rejected_cleanly(client):
    response = client.post("/campaign/rank", json={"customers": [], "capacity": 0.1})
    body = response.json()["error"]

    assert response.status_code == 422
    assert body["code"] == "VALIDATION_ERROR"
    assert any(detail["field"] == "customers" for detail in body["details"])


def test_malformed_json_returns_validation_error(client):
    response = client.post(
        "/predict",
        content='{"features": {"Age": 42,',
        headers={"Content-Type": "application/json"},
    )
    body = response.json()["error"]

    assert response.status_code == 422
    assert body["code"] == "VALIDATION_ERROR"
    assert body["request_id"]
    assert "Traceback" not in response.text


def test_prediction_rejects_target_field(client):
    response = client.post("/predict", json={"features": valid_features(Personal_Loan=1)})
    body = response.json()["error"]

    assert response.status_code == 422
    assert body["code"] == "VALIDATION_ERROR"
    assert any(detail["field"] == "features.Personal_Loan" for detail in body["details"])


def test_prediction_rejects_missing_income(client):
    features = valid_features()
    del features["Income"]

    response = client.post("/predict", json={"features": features})
    body = response.json()["error"]

    assert response.status_code == 422
    assert body["code"] == "VALIDATION_ERROR"
    detail = next(d for d in body["details"] if d["field"] == "features.Income")
    assert "required" in detail["message"].lower()


def test_non_numeric_values_are_rejected_with_field_context(client):
    response = client.post("/predict", json={"features": valid_features(Income="lots")})
    body = response.json()["error"]

    assert response.status_code == 422
    assert any(detail["field"] == "features.Income" for detail in body["details"])


def test_campaign_capacity_boundaries(client):
    customers = [{"features": valid_features()} for _ in range(4)]

    rejected = [
        client.post("/campaign/rank", json={"customers": customers, "capacity": value}).status_code
        for value in (0, 1, 1.0001, 100, -1, None)
    ]
    accepted = client.post("/campaign/rank", json={"customers": customers, "capacity": 0.999})

    assert rejected == [422] * 6
    assert accepted.status_code == 200
    assert accepted.json()["selected_count"] == 4
