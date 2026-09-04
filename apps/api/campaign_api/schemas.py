from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


OutreachPriority = Literal["higher", "lower"]


class CustomerFeatures(BaseModel):
    """Raw model inputs. Field names intentionally match the trained pipeline's expected schema."""

    model_config = ConfigDict(extra="forbid")

    Age: int = Field(..., ge=18, le=100, description="Customer age in years.")
    Experience: int = Field(..., ge=-5, le=80, description="Years of professional experience.")
    Income: float = Field(..., ge=0, le=1000, description="Annual income in thousands of dollars.")
    CCAvg: float = Field(..., ge=0, le=50, description="Average monthly credit card spend in thousands of dollars.")
    Mortgage: float = Field(..., ge=0, le=2000, description="Mortgage value in thousands of dollars (0 if none).")
    Education: int = Field(..., description="1 = Undergraduate, 2 = Graduate, 3 = Advanced/Professional.")
    Family: int = Field(..., description="Family size, 1 to 4.")
    Securities_Account: int = Field(..., description="1 if the customer holds a securities account.")
    CD_Account: int = Field(..., description="1 if the customer holds a certificate of deposit account.")
    Online: int = Field(..., description="1 if the customer uses online banking.")
    CreditCard: int = Field(..., description="1 if the customer holds a credit card with the bank.")

    @field_validator("Education")
    @classmethod
    def _education(cls, value: int) -> int:
        if value not in (1, 2, 3):
            raise ValueError("Education must be 1 (Undergraduate), 2 (Graduate), or 3 (Advanced/Professional).")
        return value

    @field_validator("Family")
    @classmethod
    def _family(cls, value: int) -> int:
        if value not in (1, 2, 3, 4):
            raise ValueError("Family must be between 1 and 4.")
        return value

    @field_validator("Securities_Account", "CD_Account", "Online", "CreditCard")
    @classmethod
    def _binary(cls, value: int) -> int:
        if value not in (0, 1):
            raise ValueError("Value must be 0 or 1.")
        return value

    def as_record(self) -> dict[str, Any]:
        return self.model_dump()


class CustomerRecord(BaseModel):
    """A customer with an optional presentation identifier. The identifier is never a model feature."""

    model_config = ConfigDict(extra="forbid")

    customer_id: str | None = Field(default=None, max_length=64)
    features: CustomerFeatures


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    features: CustomerFeatures


class PredictResponse(BaseModel):
    response_probability: float
    outreach_priority: OutreachPriority
    above_threshold: bool
    threshold: float


class BatchPredictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customers: list[CustomerRecord] = Field(..., min_length=1)


class BatchPrediction(BaseModel):
    index: int
    customer_id: str | None
    response_probability: float
    outreach_priority: OutreachPriority


class BatchPredictResponse(BaseModel):
    threshold: float
    predictions: list[BatchPrediction]


class CampaignRankRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customers: list[CustomerRecord] = Field(..., min_length=1)
    capacity: float = Field(..., gt=0, lt=1, description="Fraction of the population to contact, e.g. 0.10.")


class CampaignRanking(BaseModel):
    rank: int
    index: int
    customer_id: str | None
    response_probability: float
    selected: bool


class CampaignRankResponse(BaseModel):
    capacity: float
    population_size: int
    selected_count: int
    rankings: list[CampaignRanking]


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    model_loaded: bool


class FeatureDefinition(BaseModel):
    name: str
    label: str
    kind: Literal["integer", "number", "categorical", "binary"]
    unit: str | None = None
    minimum: float | None = None
    maximum: float | None = None
    options: list[dict[str, Any]] | None = None


class ThresholdPolicy(BaseModel):
    type: str
    selected_threshold: float
    description: str


class TopKPolicy(BaseModel):
    selected_top_k_fraction: float
    description: str


class MetadataResponse(BaseModel):
    service_version: str
    model_type: str
    estimator_class: str
    artifact_version: str
    sklearn_version: str
    model_selection_metric: str
    trained_from_commit: str | None
    expected_raw_input_fields: list[str]
    excluded_fields: list[str]
    threshold_policy: ThresholdPolicy
    top_k_policy: TopKPolicy
    feature_schema: list[FeatureDefinition]


class DemoPopulationResponse(BaseModel):
    population_size: int
    seed: int
    note: str
    customers: list[CustomerRecord]


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorBody
