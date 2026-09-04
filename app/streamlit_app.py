from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import streamlit as st


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = PROJECT_ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from loan_modeling.predict import load_model, predict_one, select_campaign_top_k  # noqa: E402
from loan_modeling.train import MODEL_PATH  # noqa: E402


SAMPLE_CUSTOMERS = {
    "High income, active relationship": {
        "Age": 42,
        "Experience": 17,
        "Income": 145,
        "CCAvg": 4.2,
        "Mortgage": 0,
        "Education": 2,
        "Family": 3,
        "Securities_Account": 0,
        "CD_Account": 1,
        "Online": 1,
        "CreditCard": 0,
    },
    "Moderate income, digital user": {
        "Age": 36,
        "Experience": 11,
        "Income": 78,
        "CCAvg": 1.8,
        "Mortgage": 85,
        "Education": 3,
        "Family": 2,
        "Securities_Account": 0,
        "CD_Account": 0,
        "Online": 1,
        "CreditCard": 1,
    },
    "Lower income, limited relationship": {
        "Age": 29,
        "Experience": 5,
        "Income": 42,
        "CCAvg": 0.7,
        "Mortgage": 0,
        "Education": 1,
        "Family": 1,
        "Securities_Account": 0,
        "CD_Account": 0,
        "Online": 0,
        "CreditCard": 0,
    },
    "Senior professional, mortgage holder": {
        "Age": 55,
        "Experience": 30,
        "Income": 118,
        "CCAvg": 2.8,
        "Mortgage": 220,
        "Education": 3,
        "Family": 4,
        "Securities_Account": 1,
        "CD_Account": 0,
        "Online": 1,
        "CreditCard": 1,
    },
}


@st.cache_resource
def cached_model():
    return load_model(MODEL_PATH)


def main() -> None:
    st.set_page_config(page_title="Loan Campaign Targeting", layout="wide")
    st.title("Personal Loan Campaign Targeting")

    if not MODEL_PATH.exists():
        st.error("Model artifact not found. Run `PYTHONPATH=src python3 -m loan_modeling.train` first.")
        st.stop()

    model = cached_model()
    threshold = model["metadata"]["threshold_policy"]["selected_threshold"]
    top_k = model["metadata"]["top_k_policy"]["selected_top_k_fraction"]

    st.caption(
        "Scores synthetic customer profiles for campaign response likelihood. "
        "This is not a credit underwriting or loan approval tool."
    )

    left, right = st.columns([1, 1])
    with left:
        st.subheader("Customer Inputs")
        sample_name = st.selectbox("Synthetic sample profile", list(SAMPLE_CUSTOMERS))
        defaults = SAMPLE_CUSTOMERS[sample_name]
        customer = customer_form(defaults)

    with right:
        st.subheader("Prediction")
        prediction = predict_one(model, customer)
        probability = prediction["predicted_probability"]
        decision = prediction["threshold_prediction"]

        st.metric("Acceptance probability", f"{probability:.1%}")
        st.metric("Probability threshold", f"{threshold:.2f}")
        if decision:
            st.success("Threshold recommendation: prioritize for outreach")
        else:
            st.info("Threshold recommendation: lower priority")

        st.caption(
            "Single-customer scoring uses the probability threshold. "
            "Top-K campaign selection requires a batch of customers."
        )

    st.divider()
    st.subheader("Fixed-Capacity Campaign Ranking")
    batch = pd.DataFrame(SAMPLE_CUSTOMERS).T.reset_index(names="profile")
    ranked = select_campaign_top_k(model, batch.drop(columns=["profile"]), k_fraction=top_k)
    display = pd.concat([batch[["profile"]], ranked], axis=1)
    display["predicted_probability"] = display["predicted_probability"].map(lambda value: f"{value:.1%}")
    display["selected_for_campaign"] = display["selected_for_campaign"].map({True: "Yes", False: "No"})
    st.dataframe(display, use_container_width=True, hide_index=True)


def customer_form(defaults: dict) -> dict:
    age = st.slider("Age", min_value=18, max_value=75, value=int(defaults["Age"]))
    experience = st.slider("Experience", min_value=0, max_value=50, value=int(defaults["Experience"]))
    income = st.number_input("Income", min_value=0, max_value=300, value=int(defaults["Income"]))
    ccavg = st.number_input("CCAvg", min_value=0.0, max_value=15.0, value=float(defaults["CCAvg"]), step=0.1)
    mortgage = st.number_input("Mortgage", min_value=0, max_value=700, value=int(defaults["Mortgage"]))

    education = st.selectbox(
        "Education",
        options=[1, 2, 3],
        index=[1, 2, 3].index(defaults["Education"]),
        format_func=lambda value: {1: "1 - Undergrad", 2: "2 - Graduate", 3: "3 - Advanced/Professional"}[value],
    )
    family = st.selectbox("Family size", options=[1, 2, 3, 4], index=[1, 2, 3, 4].index(defaults["Family"]))

    st.markdown("Account and channel indicators")
    col1, col2 = st.columns(2)
    with col1:
        securities = int(st.checkbox("Securities account", value=bool(defaults["Securities_Account"])))
        cd_account = int(st.checkbox("CD account", value=bool(defaults["CD_Account"])))
    with col2:
        online = int(st.checkbox("Online banking", value=bool(defaults["Online"])))
        credit_card = int(st.checkbox("Credit card", value=bool(defaults["CreditCard"])))

    return {
        "Age": age,
        "Experience": experience,
        "Income": income,
        "CCAvg": ccavg,
        "Mortgage": mortgage,
        "Education": education,
        "Family": family,
        "Securities_Account": securities,
        "CD_Account": cd_account,
        "Online": online,
        "CreditCard": credit_card,
    }


if __name__ == "__main__":
    main()
