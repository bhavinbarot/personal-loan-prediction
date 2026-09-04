import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-shell";
import { Hero } from "@/components/overview/hero";
import { ValidatedOutcomeSection, ValidatedOutcomeSkeleton } from "@/components/overview/validated-outcome-section";

export default function OverviewPage() {
  return (
    <PageContainer className="pb-12">
      <Hero />
      <Suspense fallback={<ValidatedOutcomeSkeleton />}>
        <ValidatedOutcomeSection />
      </Suspense>
    </PageContainer>
  );
}
