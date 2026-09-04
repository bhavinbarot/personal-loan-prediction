import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-shell";
import { DecisionComparison } from "@/components/overview/decision-comparison";
import { Hero } from "@/components/overview/hero";
import { HowItWorks } from "@/components/overview/how-it-works";
import { ValidatedOutcomeSection, ValidatedOutcomeSkeleton } from "@/components/overview/validated-outcome-section";

export default function OverviewPage() {
  return (
    <PageContainer className="pb-12">
      <Hero />
      <Suspense fallback={<ValidatedOutcomeSkeleton />}>
        <ValidatedOutcomeSection />
      </Suspense>
      <DecisionComparison />
      <HowItWorks />
    </PageContainer>
  );
}
