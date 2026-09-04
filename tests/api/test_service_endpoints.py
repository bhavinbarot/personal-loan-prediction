import json

from campaign_api.config import PROJECT_ROOT

from .conftest import valid_features


def test_health_reports_liveness_regardless_of_model(client, unavailable_client):
    assert client.get("/health").json() == {"status": "healthy"}
    assert unavailable_client.get("/health").status_code == 200
    assert unavailable_client.get("/health").json() == {"status": "healthy"}


def test_ready_reports_model_loaded(client):
    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "model_loaded": True, "reason": None}


def test_ready_reports_model_unavailable_with_503(unavailable_client):
    response = unavailable_client.get("/ready")

    assert response.status_code == 503
    assert response.json() == {"status": "not_ready", "model_loaded": False, "reason": "artifact_missing"}
    assert "/" not in response.json()["reason"]


def test_metadata_exposes_schema_and_policies_without_paths(client):
    response = client.get("/metadata")
    body = response.json()

    assert response.status_code == 200
    assert body["model_type"] == "random_forest"
    assert body["estimator_class"] == "RandomForestClassifier"
    assert body["expected_raw_input_fields"] == [
        "Age", "Experience", "Income", "CCAvg", "Mortgage", "Education", "Family",
        "Securities_Account", "CD_Account", "Online", "CreditCard",
    ]
    assert set(body["excluded_fields"]) == {"ID", "ZIPCode", "Personal_Loan"}
    assert body["threshold_policy"]["type"] == "probability_threshold"
    assert 0 < body["threshold_policy"]["selected_threshold"] < 1
    assert body["top_k_policy"]["selected_top_k_fraction"] == 0.1
    assert {f["name"] for f in body["feature_schema"]} == set(body["expected_raw_input_fields"])
    serialized = json.dumps(body)
    assert "/Users" not in serialized
    assert ".joblib" not in serialized


def test_metadata_unavailable_without_model(unavailable_client):
    response = unavailable_client.get("/metadata")

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "MODEL_UNAVAILABLE"


def test_metrics_reflect_tracked_report_files(client):
    response = client.get("/metrics")
    body = response.json()

    summary = json.loads((PROJECT_ROOT / "reports" / "run_summary.json").read_text())

    assert response.status_code == 200
    assert body["selection"]["selected_model"] == summary["selected_model"]
    assert body["selection"]["primary_metric"] == "average_precision"
    assert body["dataset"]["rows"] == summary["rows"]
    assert body["dataset"]["holdout_rows"] == summary["split"]["test_rows"]

    top10 = next(row for row in body["campaign"] if row["capacity"] == 0.1)
    assert top10["customers_contacted"] == 100
    assert top10["responders_captured"] == 93
    assert abs(top10["recall_at_k"] - 0.96875) < 1e-9

    cm = body["confusion_matrix"]
    total = cm["correctly_excluded"] + cm["false_outreach"] + cm["missed_responders"] + cm["captured_responders"]
    assert total == body["dataset"]["holdout_rows"]
    assert cm["captured_responders"] + cm["missed_responders"] == body["dataset"]["holdout_responders"]

    labels = [row["label"] for row in body["model_selection"]]
    assert labels[0] == "Random Forest"
    assert body["model_selection"][0]["selected"] is True
    assert sum(row["selected"] for row in body["model_selection"]) == 1
    assert body["holdout"]["average_precision"] > 0.9


def test_metrics_do_not_require_model(unavailable_client):
    response = unavailable_client.get("/metrics")

    assert response.status_code == 200
    assert response.json()["selection"]["selected_model"] == "random_forest"


def test_metrics_unavailable_when_reports_missing(tmp_path, trained_model_path):
    from fastapi.testclient import TestClient

    from campaign_api.config import Settings
    from campaign_api.main import create_app

    app = create_app(Settings(model_path=trained_model_path, reports_dir=tmp_path / "no-reports"))
    with TestClient(app, raise_server_exceptions=False) as test_client:
        response = test_client.get("/metrics")

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "REPORTS_UNAVAILABLE"


def test_cors_allows_only_configured_origins(client):
    allowed = client.options(
        "/health",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
    )
    denied = client.options(
        "/health",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"},
    )

    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-origin" not in denied.headers


def test_unhandled_errors_do_not_leak_tracebacks(client, monkeypatch):
    service = client.app.state.model_service

    def explode(record):
        raise RuntimeError("secret internal detail")

    monkeypatch.setattr(service, "predict_one", explode)
    response = client.post("/predict", json={"features": valid_features()})

    assert response.status_code == 500
    assert response.json()["error"]["code"] == "INTERNAL_ERROR"
    assert "secret internal detail" not in response.text
    assert "Traceback" not in response.text


def test_error_bodies_follow_the_shared_contract(client, unavailable_client):
    validation = client.post("/predict", json={"features": {}}).json()["error"]
    unavailable = unavailable_client.post("/predict", json={"features": valid_features()}).json()["error"]

    for body in (validation, unavailable):
        assert set(body) == {"code", "message", "details", "request_id"}
        assert body["code"].isupper()
        assert body["request_id"]

    assert validation["code"] == "VALIDATION_ERROR"
    assert unavailable["code"] == "MODEL_UNAVAILABLE"


def test_error_request_id_matches_response_header(unavailable_client):
    response = unavailable_client.post(
        "/predict", json={"features": valid_features()}, headers={"X-Request-ID": "trace-contract-1"}
    )

    assert response.json()["error"]["request_id"] == "trace-contract-1"
    assert response.headers["X-Request-ID"] == "trace-contract-1"
