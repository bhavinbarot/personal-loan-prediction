# Personal Loan Campaign Targeting

Applied ML project for loan campaign targeting with reproducible pipelines, leakage-safe evaluation, cross-validation, and business-focused campaign metrics.

This project models whether an existing bank customer is likely to accept a personal loan offer, so a marketing team can prioritize outreach toward the highest-scoring customers. It is a campaign response model, not a credit underwriting or loan approval system.

## Current Result

The professional workflow selects a `RandomForestClassifier` using cross-validated average precision / PR-AUC, then evaluates it once on an untouched stratified holdout set.

| Holdout metric | Value |
| --- | ---: |
| Accuracy | 0.984 |
| Precision | 0.877 |
| Recall | 0.969 |
| F1 | 0.921 |
| ROC-AUC | 0.999 |
| Average Precision / PR-AUC | 0.993 |

Confusion matrix at the selected probability threshold `0.29`:

|  | Predicted 0 | Predicted 1 |
| --- | ---: | ---: |
| Actual 0 | 891 | 13 |
| Actual 1 | 3 | 93 |

Campaign targeting is reported separately from threshold classification. At top 10% fixed campaign capacity, the model captures 93 of 96 responders in the holdout set.

## Why This Version Exists

The original course notebook reused the test set during pruning and model selection. This repository keeps the course work historical and implements a corrected professional evaluation design:

```text
Raw data
   -> stratified 80/20 development/holdout split
   -> preprocessing inside sklearn pipelines
   -> 5-fold StratifiedKFold cross-validation on development data
   -> model comparison and tuning by average precision / PR-AUC
   -> threshold selected without final holdout leakage
   -> one final evaluation on the untouched holdout set
```

Historical course-notebook metrics are not presented as current portfolio performance.

## Model Comparison

Primary selection metric: mean cross-validated average precision / PR-AUC.

| Model | Mean CV AP | Mean CV F1 | Mean CV recall | Mean CV precision |
| --- | ---: | ---: | ---: | ---: |
| Dummy baseline | 0.096 | 0.000 | 0.000 | 0.000 |
| Logistic Regression | 0.854 | 0.769 | 0.685 | 0.878 |
| Decision Tree | 0.966 | 0.913 | 0.891 | 0.940 |
| Gradient Boosting | 0.982 | 0.916 | 0.880 | 0.955 |
| Random Forest | 0.983 | 0.917 | 0.867 | 0.974 |

Random Forest was selected because it had the highest CV average precision under the predefined selection procedure.

## Campaign Metrics

Fixed-capacity campaign metrics rank customers by predicted probability and select exactly the top K records. Ties are handled deterministically by stable input order.

| Campaign group | Customers contacted | Responders captured | Precision@K | Recall@K | Lift@K |
| --- | ---: | ---: | ---: | ---: | ---: |
| Top 5% | 50 | 50 | 1.000 | 0.521 | 10.417 |
| Top 10% | 100 | 93 | 0.930 | 0.969 | 9.688 |
| Top 20% | 200 | 96 | 0.480 | 1.000 | 5.000 |

Threshold classification answers, "Which customers exceed this probability cutoff?" Top-K targeting answers, "Which exact fraction of customers should the campaign contact?" Both are useful, but they are different business policies.

## Project Structure

```text
README.md
requirements.txt
notebooks/
  01_professional_model_evaluation.ipynb
reports/
  run_summary.json
  tables/
    model_selection_cv.csv
    final_holdout_metrics.csv
    final_holdout_campaign_metrics.csv
    final_holdout_confusion_matrix.csv
src/
  loan_modeling/
    evaluate.py
    metrics.py
    models.py
    predict.py
    preprocessing.py
    train.py
tests/
  test_metrics.py
  test_models.py
  test_preprocessing.py
  test_train_predict.py
```

Original course notebooks and the original CSV are retained locally but intentionally excluded from Git.

## Data And Attribution

The original case study was completed as part of a Great Learning ML/AI program. This public repository represents my professional implementation work: methodology correction, refactoring, reproducible evaluation, testing, model packaging, and inference interface design.

The original course dataset is not distributed here because redistribution rights have not been confirmed. To reproduce the workflow, provide a compatible local file named `Loan_Modelling.csv` with the documented schema.

## Input Features

Required inference fields:

```text
Age
Experience
Income
CCAvg
Mortgage
Education
Family
Securities_Account
CD_Account
Online
CreditCard
```

These fields are intentionally not inference inputs:

```text
ID
ZIPCode
Personal_Loan
```

`Personal_Loan` is the target label. `ID` and `ZIPCode` are excluded from the primary model.

## Reproduce Evaluation

From the repository root:

```bash
PYTHONPATH=src python3 -m loan_modeling.evaluate
```

This regenerates the model-selection table, final holdout metrics, campaign metrics, confusion matrix, and run summary under `reports/`.

## Train Model Artifact

```bash
PYTHONPATH=src python3 -m loan_modeling.train
```

This creates local reproducible artifacts:

```text
artifacts/model.joblib
artifacts/model_metadata.json
```

`artifacts/` is Git-ignored because the model can be recreated from source and the local dataset.

## Inference Usage

```python
from loan_modeling.predict import load_model, predict_one

model = load_model("artifacts/model.joblib")

customer = {
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

prediction = predict_one(model, customer)
print(prediction)
```

The result contains `predicted_probability` and `threshold_prediction`. Batch scoring is available through `predict_batch`. Fixed-capacity campaign selection is available through `select_campaign_top_k`.

## Interactive Demo

After training the local model artifact, launch the Streamlit demo:

```bash
PYTHONPATH=src streamlit run app/streamlit_app.py
```

The demo uses synthetic customer profiles and manual feature entry. It does not require the original dataset at runtime once `artifacts/model.joblib` exists.

## Testing

```bash
PYTHONPATH=src pytest -q
```

Current status: 33 tests passing.

The test suite covers preprocessing, feature leakage boundaries, campaign metrics, exact top-K behavior, model pipeline contracts, artifact save/load, schema validation, and single/batch inference.

## Limitations

- The dataset has 5,000 rows and comes from a historical/course case study, not a live banking system.
- No real campaign contact cost, revenue, or profit data is provided, so business economics are not estimated as facts.
- Probability calibration has not yet been deeply analyzed.
- The model predicts campaign acceptance likelihood, not creditworthiness.
- The model should not be used as a real lending, credit approval, or compliance decision system.

## Next / Demo

A lightweight interactive demo is planned. It should allow visitors to enter synthetic customer attributes, score sample synthetic profiles, view predicted acceptance probability, and explore fixed-capacity campaign ranking without exposing real customer data or requiring the original dataset at runtime.
