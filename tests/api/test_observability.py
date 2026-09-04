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
