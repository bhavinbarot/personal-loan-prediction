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


def test_sample_customers_do_not_include_excluded_fields():
    app = load_streamlit_app()
    excluded = {"ID", "ZIPCode", "Personal_Loan"}

    for sample in app.SAMPLE_CUSTOMERS.values():
        assert not excluded & set(sample)
