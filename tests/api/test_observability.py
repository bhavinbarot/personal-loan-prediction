from campaign_api.observability import sanitize_request_id

from .conftest import valid_features


def test_every_response_carries_a_request_id(client):
    response = client.get("/health")

    request_id = response.headers.get("X-Request-ID")
    assert request_id
    assert len(request_id) == 32


def test_well_formed_incoming_request_ids_are_honored(client):
    response = client.post(
        "/predict",
        json={"features": valid_features()},
        headers={"X-Request-ID": "frontend-abc.123:7"},
    )

    assert response.headers["X-Request-ID"] == "frontend-abc.123:7"


def test_malformed_incoming_request_ids_are_replaced(client):
    response = client.get("/health", headers={"X-Request-ID": "bad id with spaces\n"})

    assert response.headers["X-Request-ID"] != "bad id with spaces\n"
    assert len(response.headers["X-Request-ID"]) == 32


def test_request_id_sanitizer_rules():
    assert sanitize_request_id("abc-123_x.y:z") == "abc-123_x.y:z"
    assert sanitize_request_id("") is None
    assert sanitize_request_id(None) is None
    assert sanitize_request_id("x" * 129) is None
    assert sanitize_request_id("<script>") is None


def test_error_responses_also_carry_a_request_id(unavailable_client):
    response = unavailable_client.post("/predict", json={"features": valid_features()})

    assert response.status_code == 503
    assert response.headers.get("X-Request-ID")


def _records(caplog, event):
    return [r for r in caplog.records if getattr(r, "event", None) == event]


def test_request_completion_is_logged_with_route_status_and_latency(client, caplog):
    import logging

    caplog.set_level(logging.INFO)
    response = client.post(
        "/predict",
        json={"features": valid_features(Income=123.45)},
        headers={"X-Request-ID": "trace-log-1"},
    )
    assert response.status_code == 200

    completed = _records(caplog, "request_completed")
    record = next(r for r in completed if getattr(r, "request_id", None) == "trace-log-1")
    assert record.method == "POST"
    assert record.route == "/predict"
    assert record.status == 200
    assert isinstance(record.duration_ms, float)


def test_logs_never_contain_inference_payloads(client, caplog):
    import logging

    caplog.set_level(logging.DEBUG)
    # Values with three decimals cannot collide with duration_ms, which is rounded to two.
    client.post("/predict", json={"features": valid_features(Income=987.654, CCAvg=6.543)})

    text = "\n".join(caplog.messages) + "\n".join(str(r.__dict__) for r in caplog.records)
    assert "987.654" not in text
    assert "6.543" not in text
    assert "CCAvg" not in text
    assert "Income" not in text


def test_json_formatter_emits_structured_fields():
    import json
    import logging

    from campaign_api.logging_config import JsonFormatter

    record = logging.LogRecord("campaign_api.test", logging.INFO, __file__, 1, "request_completed", (), None)
    record.event = "request_completed"
    record.request_id = "abc"
    record.duration_ms = 3.2
    record.features = {"Income": 100}  # must be dropped

    payload = json.loads(JsonFormatter().format(record))

    assert payload["event"] == "request_completed"
    assert payload["service"] == "campaign-api"
    assert payload["request_id"] == "abc"
    assert payload["duration_ms"] == 3.2
    assert payload["level"] == "INFO"
    assert "timestamp" in payload and "version" in payload
    assert "features" not in payload


def test_model_lifecycle_events_are_logged(tmp_path, caplog):
    import logging

    from fastapi.testclient import TestClient

    from campaign_api.config import PROJECT_ROOT, Settings
    from campaign_api.main import create_app

    caplog.set_level(logging.INFO)
    app = create_app(Settings(model_path=tmp_path / "missing.joblib", reports_dir=PROJECT_ROOT / "reports"))
    with TestClient(app):
        pass

    events = [getattr(r, "event", None) for r in caplog.records]
    assert "application_started" in events
    assert "model_load_started" in events
    failed = _records(caplog, "model_load_failed")[0]
    assert failed.reason == "artifact_missing"
    assert str(tmp_path) not in failed.getMessage() + str(failed.__dict__)
    assert "application_shutdown" in events


def test_unhandled_errors_are_logged_with_request_context(client, caplog, monkeypatch):
    import logging

    caplog.set_level(logging.ERROR)
    service = client.app.state.model_service

    def explode(record):
        raise RuntimeError("boom")

    monkeypatch.setattr(service, "predict_one", explode)
    client.post("/predict", json={"features": valid_features()}, headers={"X-Request-ID": "trace-err-1"})

    failed = _records(caplog, "prediction_failed")[0]
    assert failed.error_type == "RuntimeError"
    assert failed.route == "/predict"
