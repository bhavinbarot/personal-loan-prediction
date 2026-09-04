import { KpiCard } from "@/components/metrics/kpi-card";
import type { MetricsResponse } from "@/lib/api/types";
import { formatCount, formatDecimal } from "@/lib/format";

export function HoldoutPerformance({ metrics }: { metrics: MetricsResponse }) {
  const h = metrics.holdout;
  const primary = [
    { label: "Average Precision (PR-AUC)", value: formatDecimal(h.average_precision), detail: "Ranking quality across all cutoffs; the selection metric" },
    { label: "Recall", value: formatDecimal(h.recall), detail: `Responders flagged at the ${formatDecimal(h.threshold, 2)} threshold` },
    { label: "F1", value: formatDecimal(h.f1), detail: "Balance of precision and recall at the threshold" },
  ];
  const secondary = [
    { label: "Accuracy", value: formatDecimal(h.accuracy) },
    { label: "Precision", value: formatDecimal(h.precision) },
    { label: "ROC-AUC", value: formatDecimal(h.roc_auc) },
    { label: "Balanced accuracy", value: formatDecimal(h.balanced_accuracy) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {primary.map((item, index) => (
          <KpiCard key={item.label} label={item.label} value={item.value} detail={item.detail} emphasis={index === 0} />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {secondary.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-2 rounded-lg border border-border px-3 py-2 sm:flex-col sm:items-start sm:gap-0.5">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-sm font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">
        Measured once on the untouched holdout set of {formatCount(metrics.dataset.holdout_rows)} customers ({formatCount(metrics.dataset.holdout_responders)} responders). Accuracy is
        high partly because {Math.round((1 - metrics.dataset.positive_rate) * 100)}% of customers do not respond; ranking metrics are the meaningful ones.
      </p>
    </div>
  );
}
