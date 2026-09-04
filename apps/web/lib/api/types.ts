/**
 * TypeScript contracts mirroring the FastAPI response models in apps/api/campaign_api/schemas.py.
 * Field names intentionally match the API so the client layer does no renaming.
 */

export type OutreachPriority = "higher" | "lower";

export interface CustomerFeatures {
  Age: number;
  Experience: number;
  Income: number;
  CCAvg: number;
  Mortgage: number;
  Education: 1 | 2 | 3;
  Family: 1 | 2 | 3 | 4;
  Securities_Account: 0 | 1;
  CD_Account: 0 | 1;
  Online: 0 | 1;
  CreditCard: 0 | 1;
}

export interface CustomerRecord {
  customer_id: string | null;
  features: CustomerFeatures;
}

export interface HealthResponse {
  status: "healthy";
}

export interface ReadinessResponse {
  status: "ready" | "not_ready";
  model_loaded: boolean;
  reason: string | null;
}

export interface FeatureOption {
  value: number;
  label: string;
}

export interface FeatureDefinition {
  name: keyof CustomerFeatures;
  label: string;
  kind: "integer" | "number" | "categorical" | "binary";
  unit: string | null;
  minimum: number | null;
  maximum: number | null;
  options: FeatureOption[] | null;
}

export interface ApplicationInfo {
  name: string;
  version: string;
  git_commit: string | null;
  build_timestamp: string | null;
  schema_version: string;
}

export interface ModelInfo {
  model_type: string;
  estimator_class: string;
  artifact_version: string;
  sklearn_version: string;
  model_selection_metric: string;
  trained_from_commit: string | null;
  expected_raw_input_fields: string[];
  excluded_fields: string[];
  threshold_policy: { type: string; selected_threshold: number; description: string };
  top_k_policy: { selected_top_k_fraction: number; description: string };
}

export interface MetadataResponse {
  application: ApplicationInfo;
  model_loaded: boolean;
  model: ModelInfo | null;
  feature_schema: FeatureDefinition[];
}

export interface PredictResponse {
  response_probability: number;
  outreach_priority: OutreachPriority;
  above_threshold: boolean;
  threshold: number;
}

export interface BatchPrediction {
  index: number;
  customer_id: string | null;
  response_probability: number;
  outreach_priority: OutreachPriority;
}

export interface BatchPredictResponse {
  threshold: number;
  predictions: BatchPrediction[];
}

export interface CampaignRanking {
  rank: number;
  index: number;
  customer_id: string | null;
  response_probability: number;
  selected: boolean;
}

export interface CampaignRankResponse {
  capacity: number;
  population_size: number;
  selected_count: number;
  rankings: CampaignRanking[];
}

export interface DemoPopulationResponse {
  population_size: number;
  seed: number;
  note: string;
  customers: CustomerRecord[];
}

export interface CustomerPreset {
  id: string;
  name: string;
  features: CustomerFeatures;
}

export interface PresetsResponse {
  note: string;
  presets: CustomerPreset[];
}

export interface ModelSelectionRow {
  model: string;
  label: string;
  selected: boolean;
  best_params: Record<string, unknown>;
  mean_cv_average_precision: number;
  std_cv_average_precision: number;
  mean_cv_roc_auc: number;
  std_cv_roc_auc: number;
  mean_cv_f1: number;
  std_cv_f1: number;
  mean_cv_precision: number;
  std_cv_precision: number;
  mean_cv_recall: number;
  std_cv_recall: number;
  mean_cv_accuracy: number;
  std_cv_accuracy: number;
  mean_cv_balanced_accuracy: number;
  std_cv_balanced_accuracy: number;
}

export interface CampaignMetricRow {
  capacity: number;
  customers_contacted: number;
  responders_captured: number;
  precision_at_k: number;
  recall_at_k: number;
  lift_at_k: number;
  number_needed_to_contact: number;
}

export interface MetricsResponse {
  dataset: {
    rows: number;
    positive_count: number;
    positive_rate: number;
    development_rows: number;
    holdout_rows: number;
    holdout_fraction: number;
    holdout_responders: number;
    stratified: boolean;
  };
  cross_validation: { type: string; n_splits: number; shuffle: boolean };
  selection: {
    primary_metric: string;
    selected_model: string;
    selected_model_label: string;
    threshold_source: string;
    selected_threshold: number;
    selected_top_k_fraction: number;
  };
  model_selection: ModelSelectionRow[];
  holdout: {
    model: string;
    threshold: number;
    accuracy: number;
    balanced_accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
    average_precision: number;
  };
  confusion_matrix: {
    threshold: number;
    correctly_excluded: number;
    false_outreach: number;
    missed_responders: number;
    captured_responders: number;
    raw: {
      actual_0: { predicted_0: number; predicted_1: number };
      actual_1: { predicted_0: number; predicted_1: number };
    };
  };
  campaign: CampaignMetricRow[];
}

export interface ApiErrorDetail {
  field: string | null;
  message: string;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CAMPAIGN_CAPACITY"
  | "MODEL_UNAVAILABLE"
  | "REPORTS_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | (string & {});

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; details: ApiErrorDetail[]; request_id?: string };
}
