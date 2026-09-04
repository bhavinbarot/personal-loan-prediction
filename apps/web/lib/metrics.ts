import type { CampaignMetricRow, MetricsResponse } from "@/lib/api/types";

export interface CampaignHighlight {
  capacity: number;
  contacted: number;
  captured: number;
  totalResponders: number;
  captureRate: number;
  lift: number;
  precision: number;
}

/** Find the tracked campaign row for a capacity such as 0.10, tolerating float noise. */
export function findCampaignRow(metrics: MetricsResponse, capacity: number): CampaignMetricRow | undefined {
  return metrics.campaign.find((row) => Math.abs(row.capacity - capacity) < 1e-9);
}

/** The headline business result: the validated outcome at the selected top-K fraction. */
export function campaignHighlight(metrics: MetricsResponse, capacity = metrics.selection.selected_top_k_fraction): CampaignHighlight | null {
  const row = findCampaignRow(metrics, capacity);
  if (!row) return null;
  return {
    capacity: row.capacity,
    contacted: row.customers_contacted,
    captured: row.responders_captured,
    totalResponders: metrics.dataset.holdout_responders,
    captureRate: row.recall_at_k,
    lift: row.lift_at_k,
    precision: row.precision_at_k,
  };
}

export const CV_METRIC_LABELS: Record<string, string> = {
  average_precision: "Average Precision",
  roc_auc: "ROC-AUC",
  f1: "F1",
  precision: "Precision",
  recall: "Recall",
  accuracy: "Accuracy",
  balanced_accuracy: "Balanced accuracy",
};

export function selectedModelRow(metrics: MetricsResponse) {
  return metrics.model_selection.find((row) => row.selected) ?? metrics.model_selection[0];
}
