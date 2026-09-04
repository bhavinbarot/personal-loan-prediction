from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from campaign_api.config import PROJECT_ROOT, Settings
from campaign_api.main import create_app
from loan_modeling.train import train_final_artifact


def synthetic_training_dataset(rows: int = 60) -> pd.DataFrame:
    records = []
    for i in range(rows):
        positive = i % 4 == 0
        records.append(
            {
                "ID": i + 1,
                "Age": 25 + (i % 35),
                "Experience": -1 if i == 0 else i % 30,
                "ZIPCode": 90000 + i,
                "Income": 140 + i if positive else 40 + i,
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


def valid_features(**overrides) -> dict:
    base = {
        "Age": 42,
        "Experience": 17,
        "Income": 120,
        "CCAvg": 3.2,
        "Mortgage": 0,
        "Education": 2,
        "Family": 3,
        "Securities_Account": 0,
        "CD_Account": 1,
        "Online": 1,
        "CreditCard": 0,
    }
    base.update(overrides)
    return base


@pytest.fixture(scope="session")
def trained_model_path(tmp_path_factory) -> Path:
    """Train a small artifact from synthetic data so API tests never need the course CSV."""
    workdir = tmp_path_factory.mktemp("api-model")
    data_path = workdir / "training.csv"
    model_path = workdir / "model.joblib"
    synthetic_training_dataset().to_csv(data_path, index=False)
    train_final_artifact(data_path=data_path, model_path=model_path, metadata_path=workdir / "model_metadata.json")
    return model_path


@pytest.fixture(scope="session")
def settings(trained_model_path) -> Settings:
    return Settings(
        model_path=trained_model_path,
        reports_dir=PROJECT_ROOT / "reports",
        cors_origins=("http://localhost:3000",),
        max_batch_size=50,
    )


@pytest.fixture(scope="session")
def client(settings):
    app = create_app(settings)
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client


@pytest.fixture()
def unavailable_client(tmp_path):
    app = create_app(Settings(model_path=tmp_path / "missing.joblib", reports_dir=PROJECT_ROOT / "reports"))
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
