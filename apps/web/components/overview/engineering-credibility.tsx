import { Section } from "@/components/layout/page-shell";
import { engineeringFacts } from "@/lib/engineering";
import { formatCapacity, formatCount } from "@/lib/format";
import { loadMetrics } from "@/lib/server/metrics";

/**
 * Secondary, deliberately quieter than the business sections. When metrics are unavailable
 * the facts that do not depend on the API are still shown.
 */
export async function EngineeringCredibility() {
  const result = await loadMetrics();
  const metrics = result.ok ? result.metrics : null;
  const facts = [
    { label: "Selected model", value: metrics?.selection.selected_model_label ?? "Random Forest" },
    {
      label: "Validation",
      value: `${metrics?.cross_validation.n_splits ?? engineeringFacts.cvFolds}-fold stratified CV`,
    },
    {
      label: "Holdout",
      value: `Untouched ${formatCapacity(metrics?.dataset.holdout_fraction ?? engineeringFacts.holdoutFraction)}`,
    },
    { label: "Selection metric", value: "Average Precision" },
    { label: "Automated tests", value: `${formatCount(engineeringFacts.pythonTests + engineeringFacts.frontendTests)} passing` },
    { label: "Dataset", value: metrics ? `${formatCount(metrics.dataset.rows)} records` : "5,000 records" },
  ];

  return (
    <Section
      id="engineering"
      eyebrow="Engineering"
      title="Built to be trusted, not just demonstrated"
      description="The evaluation design, packaging, and tests behind the numbers above."
    >
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-xl border border-border bg-card px-4 py-3.5">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{fact.label}</dt>
            <dd className="mt-1 text-sm font-semibold sm:text-base">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
