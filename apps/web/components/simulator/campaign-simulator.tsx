"use client";

import { ApiErrorState } from "@/components/feedback/api-error-state";
import { CampaignShortlist } from "@/components/simulator/campaign-shortlist";
import { CapacityControl } from "@/components/simulator/capacity-control";
import { RankingChart } from "@/components/simulator/ranking-chart";
import { SimulationSummary } from "@/components/simulator/simulation-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { POPULATION_SIZE } from "@/lib/simulator/capacity";
import { useCampaignSimulation } from "@/lib/simulator/use-campaign-simulation";

export function CampaignSimulator() {
  const sim = useCampaignSimulation();
  const pending = sim.ranking.status === "loading";
  const populationSize = sim.population.status === "ready" ? sim.population.customers.length : null;

  if (sim.population.status === "error") {
    return <ApiErrorState error={sim.population.error} onRetry={sim.reloadPopulation} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start lg:gap-8">
        <CapacityControl value={sim.capacity} onChange={sim.setCapacity} disabled={sim.population.status !== "ready"} />
        <SimulationSummary
          populationSize={populationSize}
          capacity={sim.capacity}
          selectedCount={sim.displayedResult?.selected_count ?? null}
          pending={pending}
        />
      </div>

      {sim.ranking.status === "error" ? <ApiErrorState error={sim.ranking.error} onRetry={sim.retryRanking} /> : null}

      {sim.population.status === "loading" || (sim.ranking.status === "loading" && !sim.displayedResult) ? (
        <ScoringState stage={sim.population.status === "loading" ? "population" : "ranking"} />
      ) : null}

      {sim.displayedResult ? (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <RankingChart result={sim.displayedResult} pending={pending} />
        </div>
      ) : null}

      {sim.displayedResult ? <CampaignShortlist result={sim.displayedResult} pending={pending} /> : null}

      {sim.population.status === "ready" ? (
        <p className="text-xs text-muted-foreground">{sim.population.note}</p>
      ) : null}
    </div>
  );
}

/** First-run state: tells the visitor what is happening instead of showing an anonymous skeleton. */
function ScoringState({ stage }: { stage: "population" | "ranking" }) {
  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <p className="text-sm font-medium">
        {stage === "population"
          ? `Preparing ${POPULATION_SIZE} synthetic customers`
          : `Scoring ${POPULATION_SIZE} synthetic customers with the campaign model`}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        The ranking chart and shortlist will appear here in a moment.
      </p>
      <div className="mt-4 space-y-2" aria-hidden>
        <Skeleton className="h-56 rounded-xl sm:h-64" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
