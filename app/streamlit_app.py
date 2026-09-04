from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = PROJECT_ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from loan_modeling.predict import load_model, predict_one, select_campaign_top_k  # noqa: E402
from loan_modeling.train import MODEL_PATH  # noqa: E402


TABLES_DIR = PROJECT_ROOT / "reports" / "tables"

SAMPLE_CUSTOMERS = {
    "Sample Customer A": {
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
    "Sample Customer B": {
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
    "Sample Customer C": {
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
    "Sample Customer D": {
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


def load_holdout_metrics() -> dict[str, float | str]:
    return pd.read_csv(TABLES_DIR / "final_holdout_metrics.csv").iloc[0].to_dict()


def load_campaign_metrics() -> pd.DataFrame:
    return pd.read_csv(TABLES_DIR / "final_holdout_campaign_metrics.csv")


def load_model_comparison() -> pd.DataFrame:
    return pd.read_csv(TABLES_DIR / "model_selection_cv.csv")


def load_confusion_matrix() -> pd.DataFrame:
    return pd.read_csv(TABLES_DIR / "final_holdout_confusion_matrix.csv", index_col=0)


@st.cache_resource
def cached_model():
    return load_model(MODEL_PATH)


@st.cache_data
def synthetic_population(n_customers: int = 100) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    return pd.DataFrame(
        {
            "customer": [f"Customer {i:03d}" for i in range(1, n_customers + 1)],
            "Age": rng.integers(24, 66, size=n_customers),
            "Experience": rng.integers(0, 41, size=n_customers),
            "Income": rng.integers(28, 185, size=n_customers),
            "CCAvg": np.round(rng.gamma(shape=2.0, scale=1.15, size=n_customers).clip(0, 10), 1),
            "Mortgage": rng.choice([0, 0, 0, 80, 140, 220, 320], size=n_customers),
            "Education": rng.integers(1, 4, size=n_customers),
            "Family": rng.integers(1, 5, size=n_customers),
            "Securities_Account": rng.binomial(1, 0.12, size=n_customers),
            "CD_Account": rng.binomial(1, 0.08, size=n_customers),
            "Online": rng.binomial(1, 0.6, size=n_customers),
            "CreditCard": rng.binomial(1, 0.3, size=n_customers),
        }
    )


def main() -> None:
    st.set_page_config(page_title="Personal Loan Campaign Intelligence", layout="wide")
    apply_styles()

    st.title("Personal Loan Campaign Intelligence")
    st.caption("Prioritize existing customers for marketing outreach using a leakage-safe machine-learning pipeline.")
    st.info("If campaign capacity is limited, which customers are most likely to respond?")

    if not MODEL_PATH.exists():
        st.error("Model artifact not found. Run `PYTHONPATH=src python3 -m loan_modeling.train` first.")
        st.stop()

    model = cached_model()
    holdout = load_holdout_metrics()
    campaign = load_campaign_metrics()

    overview, scoring, planner, methodology = st.tabs(
        ["Executive Overview", "Customer Scoring", "Campaign Planner", "Model & Methodology"]
    )

    with overview:
        render_executive_overview(holdout, campaign)
    with scoring:
        render_customer_scoring(model)
    with planner:
        render_campaign_planner(model, campaign)
    with methodology:
        render_methodology(holdout, campaign)

    st.divider()
    with st.expander("Responsible use"):
        st.write(
            "This demo estimates likelihood of responding to a marketing campaign. "
            "It is not a credit underwriting, loan approval, eligibility, or creditworthiness model."
        )
        st.write("Demo profiles are synthetic. The original course dataset is not exposed through the application.")


def render_executive_overview(holdout: dict, campaign: pd.DataFrame) -> None:
    top_10 = campaign.loc[campaign["top_k_fraction"] == 0.10].iloc[0]

    st.subheader("Business Problem")
    st.write(
        "A bank marketing team wants to promote personal loans to existing customers. "
        "Contacting every customer is inefficient when outreach capacity is limited. "
        "The model ranks customers by predicted campaign-response probability so teams can focus on higher-propensity customers."
    )

    c1, c2, c3, c4 = st.columns(4)
    kpi_card(c1, "Selected model", "Random Forest")
    kpi_card(c2, "Holdout PR-AUC", format_decimal(holdout["average_precision"]))
    kpi_card(c3, "Holdout recall", format_percent(holdout["recall"]))
    kpi_card(c4, "Lift @ Top 10%", format_decimal(top_10["lift_at_k"]))

    st.subheader("Validated Top 10% Campaign Result")
    c1, c2, c3, c4 = st.columns(4)
    kpi_card(c1, "Customers contacted", f"{int(top_10['customers_contacted'])}")
    kpi_card(c2, "Responders captured", f"{int(top_10['responders_captured'])}")
    kpi_card(c3, "Capture rate", format_percent(top_10["recall_at_k"]))
    kpi_card(c4, "Precision@K", format_percent(top_10["precision_at_k"]))

    st.subheader("Model Workflow")
    st.markdown(
        """
        <div class="workflow">
          <span>Customer Data</span><b>-></b>
          <span>Leakage-Safe Preprocessing</span><b>-></b>
          <span>Cross-Validated Selection</span><b>-></b>
          <span>Random Forest</span><b>-></b>
          <span>Response Probability</span><b>-></b>
          <span>Campaign Ranking</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.subheader("Engineering Quality")
    cols = st.columns(4)
    kpi_card(cols[0], "Validation", "Untouched holdout")
    kpi_card(cols[1], "Selection", "5-fold CV")
    kpi_card(cols[2], "Campaign logic", "Exact top-K")
    kpi_card(cols[3], "Tests", "39 passing")


def render_customer_scoring(model: dict) -> None:
    left, right = st.columns([1.1, 0.9])

    with left:
        st.subheader("Customer Profile")
        sample_name = st.selectbox("Synthetic sample", list(SAMPLE_CUSTOMERS))
        if st.button("Load sample", width="stretch"):
            st.session_state["active_sample"] = sample_name

        active_sample = st.session_state.get("active_sample", sample_name)
        customer = customer_form(SAMPLE_CUSTOMERS[active_sample])

    with right:
        st.subheader("Campaign Recommendation")
        prediction = predict_one(model, customer)
        probability = prediction["predicted_probability"]
        threshold_prediction = prediction["threshold_prediction"]

        st.markdown('<div class="prediction-card">', unsafe_allow_html=True)
        st.metric("Campaign response probability", f"{probability:.1%}")
        if threshold_prediction:
            st.success("HIGH PRIORITY - Consider for outreach")
        else:
            st.info("LOWER PRIORITY - Below current outreach threshold")
        st.markdown("</div>", unsafe_allow_html=True)

        with st.expander("Technical details"):
            threshold = model["metadata"]["threshold_policy"]["selected_threshold"]
            st.write(f"Predicted probability: `{probability:.4f}`")
            st.write(f"Operating threshold: `{threshold:.2f}`")
            st.write(
                "Threshold classification marks records with probability greater than or equal to the cutoff. "
                "Fixed-capacity top-K campaign ranking is population-relative and is shown in the Campaign Planner."
            )

        with st.expander("What influenced this score?"):
            st.write(
                "Local model explanations are deferred. A future version should use SHAP or another legitimate "
                "model-explanation method and label the output as model behavior, not causal impact."
            )


def render_campaign_planner(model: dict, holdout_campaign: pd.DataFrame) -> None:
    st.subheader("Synthetic Campaign Population")
    st.write(
        "Choose a campaign capacity and rank a synthetic 100-customer population. "
        "These rows have model scores only; they do not contain known real campaign outcomes."
    )

    capacity = st.radio("Campaign capacity", options=[0.05, 0.10, 0.20], horizontal=True, format_func=format_top_k)
    population = synthetic_population(100)
    scored = select_campaign_top_k(model, population.drop(columns=["customer"]), k_fraction=capacity)
    ranked = pd.concat([population[["customer"]], scored], axis=1).sort_values(
        "predicted_probability", ascending=False
    )
    ranked.insert(0, "rank", range(1, len(ranked) + 1))

    selected_count = int(ranked["selected_for_campaign"].sum())
    c1, c2, c3 = st.columns(3)
    kpi_card(c1, "Campaign capacity", format_top_k(capacity))
    kpi_card(c2, "Population", "100 synthetic customers")
    kpi_card(c3, "Customers selected", f"{selected_count}")

    chart_data = ranked[["rank", "predicted_probability"]].set_index("rank")
    st.line_chart(chart_data, height=220)

    display = ranked[["rank", "customer", "predicted_probability", "selected_for_campaign"]].copy()
    display["predicted_probability"] = display["predicted_probability"].map(lambda value: f"{value:.1%}")
    display["selected_for_campaign"] = display["selected_for_campaign"].map({True: "Selected", False: "Not selected"})
    st.dataframe(display.head(20), width="stretch", hide_index=True)

    st.subheader("Validated Holdout Evidence")
    evidence = holdout_campaign.copy()
    evidence["top_k_fraction"] = evidence["top_k_fraction"].map(format_top_k)
    evidence["precision_at_k"] = evidence["precision_at_k"].map(format_percent)
    evidence["recall_at_k"] = evidence["recall_at_k"].map(format_percent)
    evidence["lift_at_k"] = evidence["lift_at_k"].map(format_decimal)
    st.dataframe(
        evidence[
            [
                "top_k_fraction",
                "customers_contacted",
                "responders_captured",
                "precision_at_k",
                "recall_at_k",
                "lift_at_k",
            ]
        ],
        width="stretch",
        hide_index=True,
    )


def render_methodology(holdout: dict, campaign: pd.DataFrame) -> None:
    st.subheader("Model Comparison")
    comparison = load_model_comparison()
    comparison = comparison[
        ["model", "mean_cv_average_precision", "mean_cv_f1", "mean_cv_recall", "mean_cv_precision"]
    ].copy()
    comparison["selected"] = comparison["model"].eq("random_forest")
    comparison = comparison.rename(
        columns={
            "model": "Model",
            "mean_cv_average_precision": "Mean CV AP",
            "mean_cv_f1": "Mean CV F1",
            "mean_cv_recall": "Mean CV recall",
            "mean_cv_precision": "Mean CV precision",
            "selected": "Selected",
        }
    )
    st.dataframe(comparison, width="stretch", hide_index=True)

    st.subheader("Holdout Performance")
    c1, c2, c3, c4, c5, c6 = st.columns(6)
    kpi_card(c1, "Accuracy", format_decimal(holdout["accuracy"]))
    kpi_card(c2, "Precision", format_decimal(holdout["precision"]))
    kpi_card(c3, "Recall", format_decimal(holdout["recall"]))
    kpi_card(c4, "F1", format_decimal(holdout["f1"]))
    kpi_card(c5, "ROC-AUC", format_decimal(holdout["roc_auc"]))
    kpi_card(c6, "PR-AUC", format_decimal(holdout["average_precision"]))

    st.subheader("Confusion Matrix")
    st.dataframe(load_confusion_matrix(), width="stretch")

    st.subheader("Campaign Performance")
    campaign_display = campaign.copy()
    campaign_display["top_k_fraction"] = campaign_display["top_k_fraction"].map(format_top_k)
    st.dataframe(campaign_display, width="stretch", hide_index=True)

    st.subheader("Methodology")
    st.markdown(
        """
        ```text
        80% development data
            -> 5-fold stratified CV
            -> model selection by average precision
            -> out-of-fold threshold selection
            -> final untouched 20% holdout evaluation
        ```
        The final holdout data is not used during model selection or threshold selection.
        """
    )
    st.write("Automated test coverage: 39 tests passing.")


def customer_form(defaults: dict) -> dict:
    st.markdown("**Customer background**")
    c1, c2 = st.columns(2)
    with c1:
        age = st.slider("Age", min_value=18, max_value=75, value=int(defaults["Age"]))
        family = st.selectbox("Family size", options=[1, 2, 3, 4], index=[1, 2, 3, 4].index(defaults["Family"]))
    with c2:
        experience = st.slider("Professional experience", min_value=0, max_value=50, value=int(defaults["Experience"]))
        education = st.selectbox(
            "Education level",
            options=[1, 2, 3],
            index=[1, 2, 3].index(defaults["Education"]),
            format_func=lambda value: {1: "Undergrad", 2: "Graduate", 3: "Advanced/Professional"}[value],
        )

    st.markdown("**Financial relationship**")
    c1, c2, c3 = st.columns(3)
    with c1:
        income = st.number_input("Annual income ($000s)", min_value=0, max_value=300, value=int(defaults["Income"]))
    with c2:
        ccavg = st.number_input(
            "Average monthly card spend ($000s)",
            min_value=0.0,
            max_value=15.0,
            value=float(defaults["CCAvg"]),
            step=0.1,
        )
    with c3:
        mortgage = st.number_input("Mortgage value ($000s)", min_value=0, max_value=700, value=int(defaults["Mortgage"]))

    c1, c2 = st.columns(2)
    with c1:
        cd_account = int(st.checkbox("CD account", value=bool(defaults["CD_Account"])))
    with c2:
        securities = int(st.checkbox("Securities account", value=bool(defaults["Securities_Account"])))

    st.markdown("**Banking channels**")
    c1, c2 = st.columns(2)
    with c1:
        online = int(st.checkbox("Online banking", value=bool(defaults["Online"])))
    with c2:
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


def kpi_card(column, label: str, value: str) -> None:
    column.markdown(
        f"""
        <div class="kpi-card">
          <div class="kpi-label">{label}</div>
          <div class="kpi-value">{value}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def format_percent(value: float) -> str:
    return f"{float(value):.1%}"


def format_decimal(value: float) -> str:
    return f"{float(value):.3f}"


def format_top_k(value: float) -> str:
    return f"Top {int(round(float(value) * 100))}%"


def apply_styles() -> None:
    st.markdown(
        """
        <style>
        .block-container {
            padding-top: 2rem;
            padding-bottom: 2rem;
            max-width: 1180px;
        }
        .kpi-card {
            border: 1px solid rgba(128, 128, 128, 0.25);
            border-radius: 8px;
            padding: 0.9rem 1rem;
            min-height: 92px;
            background: rgba(128, 128, 128, 0.06);
        }
        .kpi-label {
            font-size: 0.82rem;
            opacity: 0.76;
            margin-bottom: 0.35rem;
        }
        .kpi-value {
            font-size: 1.35rem;
            font-weight: 650;
        }
        .workflow {
            display: flex;
            flex-wrap: wrap;
            gap: 0.45rem;
            align-items: center;
            margin: 0.5rem 0 1rem;
        }
        .workflow span {
            border: 1px solid rgba(128, 128, 128, 0.25);
            border-radius: 8px;
            padding: 0.45rem 0.65rem;
            background: rgba(128, 128, 128, 0.06);
            font-size: 0.9rem;
        }
        .prediction-card {
            border: 1px solid rgba(128, 128, 128, 0.25);
            border-radius: 8px;
            padding: 1rem;
            background: rgba(128, 128, 128, 0.06);
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
