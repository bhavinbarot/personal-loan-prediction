import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer, PageHeader } from "@/components/layout/page-shell";
import { CampaignSimulator } from "@/components/simulator/campaign-simulator";
import { ValidatedBenchmark } from "@/components/simulator/validated-benchmark";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Campaign Simulator",
  description: "Rank a synthetic customer population by predicted campaign response and apply a fixed outreach capacity.",
};

export default function SimulatorPage() {
  return (
    <PageContainer className="pb-16">
      <PageHeader
        eyebrow="Live synthetic simulator"
        title="Campaign Simulator"
        description="Score a synthetic population, choose how many customers the campaign can reach, and see who is prioritized. Scores are model predictions, not observed outcomes."
      />
      <div className="flex flex-col gap-6">
        <CampaignSimulator />
        <Suspense fallback={<Skeleton className="h-40 rounded-2xl" aria-label="Loading validated benchmark" />}>
          <ValidatedBenchmark />
        </Suspense>
      </div>
    </PageContainer>
  );
}
