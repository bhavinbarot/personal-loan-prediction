from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from campaign_api import __version__
from campaign_api.config import (
    DEMO_POPULATION_DEFAULT,
    DEMO_POPULATION_MAX,
    DEMO_POPULATION_MIN,
    DEMO_POPULATION_SEED,
    Settings,
)
from campaign_api.demo_population import DEMO_NOTE, generate_population
from campaign_api.errors import MODEL_UNAVAILABLE_MESSAGE, ModelUnavailableError, ReportsUnavailableError
from campaign_api.feature_schema import FEATURE_SCHEMA
from campaign_api.model_service import ModelService
from campaign_api.observability import RequestContextMiddleware
from campaign_api.reports import load_validation_report
from campaign_api.schemas import (
    BatchPredictRequest,
    BatchPredictResponse,
    CampaignRankRequest,
    CampaignRankResponse,
    CustomerRecord,
    DemoPopulationResponse,
    ErrorResponse,
    HealthResponse,
    MetadataResponse,
    PredictRequest,
    PredictResponse,
)


logger = logging.getLogger("campaign_api")

ERROR_RESPONSES = {
    422: {"model": ErrorResponse, "description": "Validation error"},
    503: {"model": ErrorResponse, "description": "Model unavailable"},
}


def _error(status_code: int, code: str, message: str, details: list[dict] | None = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


def _format_validation_details(exc: RequestValidationError) -> list[dict]:
    details = []
    for error in exc.errors():
        location = [str(part) for part in error.get("loc", []) if part != "body"]
        message = error.get("msg", "Invalid value.")
        if message.startswith("Value error, "):
            message = message[len("Value error, ") :]
        details.append({"field": ".".join(location) or None, "message": message})
    return details


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    model_service = ModelService(settings.model_path)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        model_service.load()
        yield

    app = FastAPI(
        title="Personal Loan Campaign Intelligence API",
        version=__version__,
        description=(
            "Scores existing bank customers by predicted likelihood of responding to a personal loan "
            "marketing campaign and ranks them for fixed-capacity outreach. This is a campaign-response "
            "model, not a credit, eligibility, or approval model."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url=None,
    )
    app.state.settings = settings
    app.state.model_service = model_service

    # Middleware runs in reverse registration order: CORS is outermost, then request context.
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
    )

    # ---- error handling -------------------------------------------------

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        return _error(422, "validation_error", "Request did not match the expected schema.", _format_validation_details(exc))

    @app.exception_handler(ModelUnavailableError)
    async def _model_unavailable(_: Request, __: ModelUnavailableError):
        return _error(503, "model_unavailable", MODEL_UNAVAILABLE_MESSAGE)

    @app.exception_handler(ReportsUnavailableError)
    async def _reports_unavailable(_: Request, exc: ReportsUnavailableError):
        logger.error("Validation reports unavailable: %s", exc)
        return _error(503, "reports_unavailable", "Validated report metrics are not available.")

    @app.exception_handler(ValueError)
    async def _value_error(_: Request, exc: ValueError):
        # Raised by loan_modeling.predict.validate_records for schema problems that pass Pydantic.
        return _error(422, "invalid_input", str(exc))

    @app.exception_handler(HTTPException)
    async def _http_error(_: Request, exc: HTTPException):
        return _error(exc.status_code, "http_error", str(exc.detail))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        logger.exception("Unhandled error while processing request")
        return _error(500, "internal_error", "An unexpected error occurred.")

    # ---- routes ---------------------------------------------------------

    @app.get("/health", response_model=HealthResponse, tags=["service"])
    async def health():
        loaded = model_service.is_loaded
        return {"status": "ok" if loaded else "degraded", "model_loaded": loaded}

    @app.get("/metadata", response_model=MetadataResponse, responses=ERROR_RESPONSES, tags=["service"])
    async def metadata():
        meta = model_service.metadata
        return {
            "service_version": __version__,
            "model_type": meta["model_type"],
            "estimator_class": meta["estimator_class"],
            "artifact_version": meta["artifact_version"],
            "sklearn_version": meta["sklearn_version"],
            "model_selection_metric": meta["model_selection_metric"],
            "trained_from_commit": meta.get("git_commit_sha"),
            "expected_raw_input_fields": meta["expected_raw_input_fields"],
            "excluded_fields": meta["excluded_fields"],
            "threshold_policy": meta["threshold_policy"],
            "top_k_policy": meta["top_k_policy"],
            "feature_schema": FEATURE_SCHEMA,
        }

    @app.get("/metrics", responses=ERROR_RESPONSES, tags=["validation"])
    async def metrics():
        return load_validation_report(settings.reports_dir)

    @app.post("/predict", response_model=PredictResponse, responses=ERROR_RESPONSES, tags=["inference"])
    async def predict(request: PredictRequest):
        return model_service.predict_one(request.features.as_record())

    @app.post("/predict/batch", response_model=BatchPredictResponse, responses=ERROR_RESPONSES, tags=["inference"])
    async def predict_batch(request: BatchPredictRequest):
        _enforce_batch_size(len(request.customers), settings.max_batch_size)
        records = [customer.features.as_record() for customer in request.customers]
        predictions = model_service.predict_many(records)
        for prediction, customer in zip(predictions, request.customers):
            prediction["customer_id"] = customer.customer_id
        return {"threshold": model_service.threshold, "predictions": predictions}

    @app.post("/campaign/rank", response_model=CampaignRankResponse, responses=ERROR_RESPONSES, tags=["inference"])
    async def campaign_rank(request: CampaignRankRequest):
        _enforce_batch_size(len(request.customers), settings.max_batch_size)
        records = [customer.features.as_record() for customer in request.customers]
        rankings = model_service.rank_campaign(records, request.capacity)
        for row in rankings:
            row["customer_id"] = request.customers[row["index"]].customer_id
        return {
            "capacity": request.capacity,
            "population_size": len(rankings),
            "selected_count": sum(1 for row in rankings if row["selected"]),
            "rankings": rankings,
        }

    @app.get("/demo/population", response_model=DemoPopulationResponse, tags=["demo"])
    async def demo_population(
        size: int = Query(DEMO_POPULATION_DEFAULT, ge=DEMO_POPULATION_MIN, le=DEMO_POPULATION_MAX),
    ):
        customers = generate_population(size)
        return {
            "population_size": len(customers),
            "seed": DEMO_POPULATION_SEED,
            "note": DEMO_NOTE,
            "customers": [CustomerRecord.model_validate(customer) for customer in customers],
        }

    return app


def _enforce_batch_size(count: int, limit: int) -> None:
    if count > limit:
        raise ValueError(f"At most {limit} customers can be scored per request.")


app = create_app()
