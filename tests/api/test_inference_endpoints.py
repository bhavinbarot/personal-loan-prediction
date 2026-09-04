import numpy as np

from loan_modeling.metrics import top_k_count
from loan_modeling.predict import select_campaign_top_k

from .conftest import valid_features


def test_predict_returns_probability_and_outreach_priority(client):
    response = client.post("/predict", json={"features": valid_features()})
    body = response.json()

    assert response.status_code == 200
    assert 0.0 <= body["response_probability"] <= 1.0
    assert body["outreach_priority"] in {"higher", "lower"}
    assert body["above_threshold"] == (body["response_probability"] >= body["threshold"])
    assert body["outreach_priority"] == ("higher" if body["above_threshold"] else "lower")


def test_predict_matches_loan_modeling_prediction(client):
    from loan_modeling.predict import predict_one

    bundle = client.app.state.model_service.bundle
    expected = predict_one(bundle, valid_features())

    body = client.post("/predict", json={"features": valid_features()}).json()

    assert body["response_probability"] == expected["predicted_probability"]
    assert body["above_threshold"] == bool(expected["threshold_prediction"])


def test_predict_rejects_missing_feature(client):
    features = valid_features()
    del features["Income"]

    response = client.post("/predict", json={"features": features})
    body = response.json()

    assert response.status_code == 422
    assert body["error"]["code"] == "validation_error"
    assert any(detail["field"] == "features.Income" for detail in body["error"]["details"])


def test_predict_rejects_invalid_education_value(client):
    response = client.post("/predict", json={"features": valid_features(Education=4)})
    body = response.json()

    assert response.status_code == 422
    detail = next(d for d in body["error"]["details"] if d["field"] == "features.Education")
    assert "Education must be" in detail["message"]


def test_predict_rejects_excluded_and_unknown_fields(client):
    for extra in ({"ID": 5}, {"ZIPCode": 94112}, {"Personal_Loan": 1}, {"Favorite_Color": "blue"}):
        response = client.post("/predict", json={"features": valid_features(**extra)})
        assert response.status_code == 422, extra
        fields = {detail["field"] for detail in response.json()["error"]["details"]}
        assert f"features.{next(iter(extra))}" in fields


def test_predict_rejects_binary_and_range_violations(client):
    assert client.post("/predict", json={"features": valid_features(CD_Account=2)}).status_code == 422
    assert client.post("/predict", json={"features": valid_features(Age=5)}).status_code == 422
    assert client.post("/predict", json={"features": valid_features(Family=0)}).status_code == 422


def test_predict_unavailable_when_artifact_missing(unavailable_client):
    response = unavailable_client.post("/predict", json={"features": valid_features()})
    body = response.json()

    assert response.status_code == 503
    assert body["error"]["code"] == "model_unavailable"
    assert "loan_modeling.train" in body["error"]["message"]


def test_batch_prediction_preserves_order_and_identifiers(client):
    customers = [
        {"customer_id": "Customer 001", "features": valid_features()},
        {"customer_id": "Customer 002", "features": valid_features(Income=60, CD_Account=0)},
        {"features": valid_features(Income=150, CCAvg=5.0)},
    ]

    response = client.post("/predict/batch", json={"customers": customers})
    body = response.json()

    assert response.status_code == 200
    assert [p["index"] for p in body["predictions"]] == [0, 1, 2]
    assert [p["customer_id"] for p in body["predictions"]] == ["Customer 001", "Customer 002", None]
    assert all(0 <= p["response_probability"] <= 1 for p in body["predictions"])
    assert all(p["outreach_priority"] in {"higher", "lower"} for p in body["predictions"])


def test_batch_prediction_rejects_empty_and_oversized_batches(client):
    empty = client.post("/predict/batch", json={"customers": []})
    oversized = client.post(
        "/predict/batch",
        json={"customers": [{"features": valid_features()} for _ in range(51)]},
    )

    assert empty.status_code == 422
    assert oversized.status_code == 422
    assert "At most 50" in oversized.json()["error"]["message"]


def _population(n: int) -> list[dict]:
    rng = np.random.default_rng(7)
    customers = []
    for i in range(n):
        customers.append(
            {
                "customer_id": f"Customer {i + 1:03d}",
                "features": valid_features(
                    Income=int(rng.integers(20, 200)),
                    CCAvg=float(np.round(rng.uniform(0.2, 6.0), 1)),
                    CD_Account=int(rng.integers(0, 2)),
                    Education=int(rng.integers(1, 4)),
                ),
            }
        )
    return customers


def test_campaign_rank_selects_exact_top_k(client):
    customers = _population(23)
    capacity = 0.10

    response = client.post("/campaign/rank", json={"customers": customers, "capacity": capacity})
    body = response.json()

    assert response.status_code == 200
    assert body["population_size"] == 23
    assert body["selected_count"] == top_k_count(23, capacity) == 3
    assert [row["rank"] for row in body["rankings"]] == list(range(1, 24))

    probabilities = [row["response_probability"] for row in body["rankings"]]
    assert probabilities == sorted(probabilities, reverse=True)
    assert [row["selected"] for row in body["rankings"]] == [True] * 3 + [False] * 20
    assert {row["customer_id"] for row in body["rankings"]} == {c["customer_id"] for c in customers}


def test_campaign_rank_matches_loan_modeling_selection(client):
    customers = _population(15)
    bundle = client.app.state.model_service.bundle
    expected = select_campaign_top_k(bundle, [c["features"] for c in customers], k_fraction=0.20)

    body = client.post("/campaign/rank", json={"customers": customers, "capacity": 0.20}).json()

    by_index = {row["index"]: row for row in body["rankings"]}
    for index, expected_row in expected.iterrows():
        assert by_index[index]["selected"] == bool(expected_row["selected_for_campaign"])
        assert by_index[index]["response_probability"] == float(expected_row["predicted_probability"])


def test_campaign_rank_breaks_ties_by_input_order(client):
    # Identical customers produce identical probabilities; the earliest input rows must win.
    customers = [{"customer_id": f"Customer {i:03d}", "features": valid_features()} for i in range(1, 5)]

    body = client.post("/campaign/rank", json={"customers": customers, "capacity": 0.50}).json()

    selected_ids = [row["customer_id"] for row in body["rankings"] if row["selected"]]
    assert selected_ids == ["Customer 001", "Customer 002"]


def test_campaign_rank_validates_capacity(client):
    customers = _population(5)
    for capacity in (0, 1, 1.5, -0.1, "ten"):
        response = client.post("/campaign/rank", json={"customers": customers, "capacity": capacity})
        assert response.status_code == 422, capacity
        assert response.json()["error"]["code"] == "validation_error"
        assert any(detail["field"] == "capacity" for detail in response.json()["error"]["details"])


def test_campaign_rank_unavailable_when_artifact_missing(unavailable_client):
    response = unavailable_client.post("/campaign/rank", json={"customers": _population(5), "capacity": 0.2})

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "model_unavailable"
