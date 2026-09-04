import { apiRequest, type RequestOptions } from "./client";
import type {
  BatchPredictResponse,
  CampaignRankResponse,
  CustomerFeatures,
  CustomerRecord,
  DemoPopulationResponse,
  HealthResponse,
  MetadataResponse,
  MetricsResponse,
  PredictResponse,
  PresetsResponse,
  ReadinessResponse,
} from "./types";

type CallOptions = Pick<RequestOptions, "signal" | "cache" | "next" | "timeoutMs">;

export function getHealth(options?: CallOptions) {
  return apiRequest<HealthResponse>("/health", options);
}

export function getReadiness(options?: CallOptions) {
  return apiRequest<ReadinessResponse>("/ready", options);
}

export function getMetadata(options?: CallOptions) {
  return apiRequest<MetadataResponse>("/metadata", options);
}

export function getMetrics(options?: CallOptions) {
  return apiRequest<MetricsResponse>("/metrics", options);
}

export function predictCustomer(features: CustomerFeatures, options?: CallOptions) {
  return apiRequest<PredictResponse>("/predict", { ...options, method: "POST", body: { features } });
}

export function predictBatch(customers: CustomerRecord[], options?: CallOptions) {
  return apiRequest<BatchPredictResponse>("/predict/batch", { ...options, method: "POST", body: { customers } });
}

export function rankCampaign(customers: CustomerRecord[], capacity: number, options?: CallOptions) {
  return apiRequest<CampaignRankResponse>("/campaign/rank", {
    ...options,
    method: "POST",
    body: { customers, capacity },
  });
}

export function getDemoPopulation(size?: number, options?: CallOptions) {
  const query = size === undefined ? "" : `?size=${encodeURIComponent(size)}`;
  return apiRequest<DemoPopulationResponse>(`/demo/population${query}`, options);
}

export function getPresets(options?: CallOptions) {
  return apiRequest<PresetsResponse>("/demo/presets", options);
}
