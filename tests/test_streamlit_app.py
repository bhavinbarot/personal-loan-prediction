import importlib.util
from pathlib import Path


def load_streamlit_app():
    module_path = Path("app/streamlit_app.py")
    spec = importlib.util.spec_from_file_location("streamlit_app", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_sample_customers_match_inference_schema():
    app = load_streamlit_app()

    required = {
        "Age",
        "Experience",
        "Income",
        "CCAvg",
        "Mortgage",
        "Education",
        "Family",
        "Securities_Account",
        "CD_Account",
        "Online",
        "CreditCard",
    }

    assert app.SAMPLE_CUSTOMERS
    for sample in app.SAMPLE_CUSTOMERS.values():
        assert set(sample) == required


def test_sample_customers_use_neutral_names():
    app = load_streamlit_app()

    assert list(app.SAMPLE_CUSTOMERS) == [
        "Sample Customer A",
        "Sample Customer B",
        "Sample Customer C",
        "Sample Customer D",
    ]


def test_sample_customers_do_not_include_excluded_fields():
    app = load_streamlit_app()
    excluded = {"ID", "ZIPCode", "Personal_Loan"}

    for sample in app.SAMPLE_CUSTOMERS.values():
        assert not excluded & set(sample)


def test_synthetic_population_has_expected_schema_and_no_outcomes():
    app = load_streamlit_app()
    population = app.synthetic_population(100)

    assert len(population) == 100
    assert "customer" in population.columns
    assert "Personal_Loan" not in population.columns
    assert "ID" not in population.columns
    assert "ZIPCode" not in population.columns


def test_synthetic_population_is_deterministic():
    app = load_streamlit_app()

    first = app.synthetic_population(10)
    second = app.synthetic_population(10)

    assert first.equals(second)


def test_formatting_helpers_are_consistent():
    app = load_streamlit_app()

    assert app.format_percent(0.96875) == "96.9%"
    assert app.format_decimal(0.993053) == "0.993"
    assert app.format_top_k(0.10) == "Top 10%"
