# Personal Loan Campaign Intelligence

A campaign prioritization system for a bank marketing team: when outreach capacity is limited, which existing customers should be contacted first? The project takes a validated machine-learning model through a reusable Python package, an inference API, and a responsive product interface.

It is a campaign response model, not a credit underwriting, eligibility, or loan approval system.

```text
Browser -> Next.js (apps/web) -> FastAPI (apps/api) -> loan_modeling (src/) -> sklearn pipeline -> model artifact
```

- **Overview**: the business problem, the validated result, and how the system works.
- **Campaign Simulator**: rank a synthetic population, apply a capacity, inspect the shortlist, and explore one customer.
- **Technical Validation**: model comparison, untouched holdout performance, campaign metrics, methodology, and service status.

## Run it locally

Prerequisites: Python 3.11+, Node 20+, and a local model artifact (see [Train Model Artifact](#train-model-artifact)).

```bash
pip install -r requirements.txt
cd apps/web && npm install && cd ../..

# Terminal 1: API on http://localhost:8000
make api

# Terminal 2: web app on http://localhost:3000
make web
```

`apps/web/.env.example` documents `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`) and the optional server-side `API_BASE_URL`. `apps/api/.env.example` documents the API's `CORS_ALLOWED_ORIGINS`, `LOAN_MODEL_PATH`, `LOAN_REPORTS_DIR`, and logging/build variables. Without the model artifact the API still starts, reports `not_ready`, and the web app shows explicit unavailable states.

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
docker-compose.yml       local production-like environment
apps/
  api/
    Dockerfile           API production image
    campaign_api/        FastAPI inference service
    scripts/             preset selection (scores a synthetic pool with the model)
  web/
    Dockerfile           web production image
    app/                 Next.js App Router pages: /, /simulator, /validation
    components/          layout, overview, simulator, customer, validation, feedback, ui
    lib/                 typed API client, formatting, simulator and form logic
docs/
  decisions/             architecture decision records
  operations.md          probes, logs, request IDs, failure scenarios
app/
  streamlit_app.py       historical Streamlit prototype
tests/
  test_metrics.py
  test_models.py
  test_preprocessing.py
  test_train_predict.py
  test_streamlit_app.py
  api/                   API tests
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

## Inference API

A FastAPI service in `apps/api/` exposes the validated pipeline over HTTP. It reuses `loan_modeling.predict` for schema validation, scoring, and exact top-K campaign selection; no ML logic lives in the API layer.

```bash
PYTHONPATH=src:apps/api python3 -m uvicorn campaign_api.main:app --reload --port 8000
# or: make api
```

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Liveness: the API process is up |
| `GET /ready` | Readiness: the model artifact is loaded and inference is possible (503 otherwise) |
| `GET /metadata` | Application version, git commit, build timestamp, model type, input schema, threshold and top-K policies |
| `GET /metrics` | Validated metrics read from the tracked `reports/` files |
| `POST /predict` | Score one customer: response probability and outreach priority |
| `POST /predict/batch` | Score many customers |
| `POST /campaign/rank` | Exact top-K ranking for a given campaign capacity |
| `GET /demo/population` | Deterministic synthetic customers for the public demo |

Errors are returned as structured JSON (`{"error": {"code", "message", "details", "request_id"}}`) without tracebacks. Codes are a small stable contract: `VALIDATION_ERROR`, `INVALID_CAMPAIGN_CAPACITY`, `MODEL_UNAVAILABLE`, `REPORTS_UNAVAILABLE`, `INTERNAL_ERROR`. If the artifact is missing the service still starts, `/ready` reports `not_ready`, and prediction endpoints return `503` with the command needed to generate it.

Configuration (see `apps/api/.env.example`): `LOAN_MODEL_PATH`, `LOAN_REPORTS_DIR`, `CORS_ALLOWED_ORIGINS`, `LOG_LEVEL`, `APP_GIT_COMMIT`, `APP_BUILD_TIMESTAMP`.

## Reliability & Operations

- Structured JSON logs with service, version, event, request ID, route, status, and latency; request bodies and customer values are never logged
- Request correlation through `X-Request-ID`, echoed on every response and embedded in every error body
- Separate liveness (`/health`) and readiness (`/ready`) probes
- Model artifact readiness detection with safe failure reasons (`artifact_missing`, `artifact_invalid`)
- Consistent client-safe error contract; no tracebacks or filesystem paths leave the service
- Frontend states for service unavailable, model not loaded, validation feedback, loading, and retry
- Automated backend and frontend tests including failure paths
- Production containers that run as non-root users with liveness health checks; compose gates the web service on API readiness

Details: [docs/operations.md](docs/operations.md). Design rationale: [docs/decisions/](docs/decisions/).

## Streamlit Prototype

The original Streamlit prototype is retained as a historical UI exploration and is not part of the production runtime. After training the local model artifact:

```bash
PYTHONPATH=src streamlit run app/streamlit_app.py
```

The demo uses synthetic customer profiles and manual feature entry. It does not require the original dataset at runtime once `artifacts/model.joblib` exists.

## Run with Containers

Both services have production images, and a compose file runs them together. The API image needs the local model artifact (`make train`) because the artifact is not tracked.

```bash
make train                    # once
docker compose up --build     # web on http://localhost:3000, API on http://localhost:8000
```

`docker-compose.yml` documents the overridable variables: `NEXT_PUBLIC_API_BASE_URL` (baked into the browser bundle at build time), `WEB_ORIGIN` (allowed CORS origin), `API_PORT`, `WEB_PORT`, `LOG_LEVEL`, and `APP_GIT_COMMIT` / `APP_BUILD_TIMESTAMP` for release provenance. The web service waits for the API's `/ready` check, so it only starts once the model is loaded. Individual images:

```bash
docker build -f apps/api/Dockerfile -t campaign-api .
docker build -t campaign-web --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 apps/web
```

## Web Application

`apps/web` is a mobile-first Next.js 16 application (App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts) with application-controlled light, dark, and system themes. Report-backed pages render server-side from the API's `/metrics` endpoint; the simulator and customer explorer call the API from the browser through a typed client that maps the error contract to loading, validation, unavailable, and retry states. No ML logic runs in JavaScript.

```bash
cd apps/web
npm run lint && npm run typecheck && npm run test:run && npm run build
# or, from the repository root: make web-check
```

## Testing

```bash
python3 -m pytest -q
# or: make test
```

`pytest.ini` puts `src` and `apps/api` on the import path, so no `PYTHONPATH` is needed. Frontend tests run with `npm run test:run` in `apps/web`.

The suite covers preprocessing, feature leakage boundaries, campaign metrics, exact top-K behavior, model pipeline contracts, artifact save/load, schema validation, single/batch inference, and the HTTP API (health, metadata, metrics, prediction, batch prediction, campaign ranking, capacity validation, and model-unavailable behavior). API tests train a small artifact from synthetic data and never read the course CSV.

## Limitations

- The dataset has 5,000 rows and comes from a historical/course case study, not a live banking system.
- No real campaign contact cost, revenue, or profit data is provided, so business economics are not estimated as facts.
- Probability calibration has not yet been deeply analyzed.
- The model predicts campaign acceptance likelihood, not creditworthiness.
- The model should not be used as a real lending, credit approval, or compliance decision system.

## Next / Demo

A lightweight interactive demo is planned. It should allow visitors to enter synthetic customer attributes, score sample synthetic profiles, view predicted acceptance probability, and explore fixed-capacity campaign ranking without exposing real customer data or requiring the original dataset at runtime.
