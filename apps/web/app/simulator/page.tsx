import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Campaign Simulator",
  description: "Rank a synthetic customer population by predicted campaign response and apply a fixed outreach capacity.",
};

export default function SimulatorPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Live synthetic simulator"
        title="Campaign Simulator"
        description="Score a synthetic population, choose how many customers the campaign can reach, and see who is prioritized."
      />
      <div className="grid gap-4 pb-16 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </PageContainer>
  );
}
