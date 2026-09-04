import type { Metadata } from "next";

import { RefreshButton } from "@/components/feedback/refresh-button";
import { PageContainer, PageHeader, Section } from "@/components/layout/page-shell";
import { CampaignPerformanceCharts } from "@/components/validation/campaign-performance-chart";
import { CampaignPerformanceTable } from "@/components/validation/campaign-performance-table";
import { ConfusionMatrix } from "@/components/validation/confusion-matrix";
import { HoldoutPerformance } from "@/components/validation/holdout-performance";
import { ModelComparisonChart } from "@/components/validation/model-comparison-chart";
import { ModelComparisonTable } from "@/components/validation/model-comparison-table";
import type { MetricsResponse } from "@/lib/api/types";
import { loadMetrics } from "@/lib/server/metrics";

export const metadata: Metadata = {
  title: "Technical Validation",
  description: "Model comparison, untouched holdout performance, campaign metrics, and evaluation methodology.",
};

export default async function ValidationPage() {
  const result = await loadMetrics();

  return (
    <PageContainer className="pb-16">
      <PageHeader
        eyebrow="Evidence"
        title="Technical Validation"
        description="How the model was selected, how it performed on untouched data, and how the evaluation was kept leakage-safe."
      />

      {!result.ok ? (
        <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-6 sm:p-8">
          <p className="font-medium">Validated results are temporarily unavailable</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            The metrics service could not be reached. The numbers on this page come from tracked evaluation reports and
            will appear once the API is back.
          </p>
          <RefreshButton />
        </div>
      ) : (
        <ValidationSections metrics={result.metrics} />
      )}
    </PageContainer>
  );
}

function ValidationSections({ metrics }: { metrics: MetricsResponse }) {
  const selected = metrics.selection.selected_model_label;
  return (
    <>
      <Section
        id="model-comparison"
        eyebrow="Model selection"
        title={`Selected: ${selected}`}
        description={`${selected} achieved the highest predefined mean cross-validated Average Precision. Selection was decided before any holdout data was scored.`}
        className="pt-0"
      >
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <ModelComparisonChart rows={metrics.model_selection} />
          <div className="mt-4">
            <ModelComparisonTable rows={metrics.model_selection} />
          </div>
        </div>
      </Section>

      <Section
        id="holdout"
        eyebrow="Holdout performance"
        title="One scoring pass on untouched data"
        description="Ranking quality first; threshold-dependent metrics second."
      >
        <HoldoutPerformance metrics={metrics} />
      </Section>

      <Section
        id="confusion"
        eyebrow="Threshold outcomes"
        title="What the operating threshold would have done"
        description="Holdout outcomes translated into campaign terms."
      >
        <ConfusionMatrix metrics={metrics} />
      </Section>

      <Section
        id="campaign"
        eyebrow="Campaign performance"
        title="Fixed-capacity outreach on the holdout set"
        description="Exactly the top 5%, 10%, and 20% of holdout customers ranked by the model, with responder capture and lift versus random contact."
      >
        <CampaignPerformanceCharts rows={metrics.campaign} />
        <div className="mt-4">
          <CampaignPerformanceTable rows={metrics.campaign} totalResponders={metrics.dataset.holdout_responders} />
        </div>
      </Section>
    </>
  );
}
