from campaign_api.demo_population import generate_population
from campaign_api.schemas import CustomerRecord
from loan_modeling.predict import validate_records


def test_demo_population_is_deterministic_and_schema_valid():
    first = generate_population(50)
    second = generate_population(50)

    assert first == second
    assert [c["customer_id"] for c in first[:3]] == ["Customer 001", "Customer 002", "Customer 003"]
    for customer in first:
        CustomerRecord.model_validate(customer)
        assert not {"ID", "ZIPCode", "Personal_Loan"} & set(customer["features"])
    validate_records([c["features"] for c in first])


def test_demo_population_endpoint_returns_requested_size(client):
    response = client.get("/demo/population", params={"size": 40})
    body = response.json()

    assert response.status_code == 200
    assert body["population_size"] == 40
    assert len(body["customers"]) == 40
    assert "synthetic" in body["note"].lower()
    assert body["customers"][0]["customer_id"] == "Customer 001"


def test_demo_population_endpoint_defaults_and_bounds(client):
    default = client.get("/demo/population")
    too_small = client.get("/demo/population", params={"size": 5})
    too_large = client.get("/demo/population", params={"size": 5000})

    assert default.json()["population_size"] == 200
    assert too_small.status_code == 422
    assert too_large.status_code == 422


def test_demo_population_can_be_ranked_end_to_end(client):
    population = client.get("/demo/population", params={"size": 30}).json()["customers"]

    response = client.post("/campaign/rank", json={"customers": population, "capacity": 0.10})
    body = response.json()

    assert response.status_code == 200
    assert body["selected_count"] == 3
    assert len({row["response_probability"] for row in body["rankings"]}) > 1


def test_demo_presets_are_neutral_schema_valid_and_outcome_free(client):
    response = client.get("/demo/presets")
    body = response.json()

    assert response.status_code == 200
    assert [preset["name"] for preset in body["presets"]] == [
        "Sample Customer A",
        "Sample Customer B",
        "Sample Customer C",
        "Sample Customer D",
    ]
    for preset in body["presets"]:
        assert set(preset) == {"id", "name", "features"}
        CustomerRecord.model_validate({"customer_id": preset["id"], "features": preset["features"]})
    validate_records([preset["features"] for preset in body["presets"]])

    text = response.text.lower()
    for revealing in ("band", "probability", "high", "low", "approved", "eligible"):
        assert revealing not in text, revealing


def test_demo_presets_can_be_scored(client):
    presets = client.get("/demo/presets").json()["presets"]

    for preset in presets:
        response = client.post("/predict", json={"features": preset["features"]})
        assert response.status_code == 200, preset["name"]
        assert 0 <= response.json()["response_probability"] <= 1
