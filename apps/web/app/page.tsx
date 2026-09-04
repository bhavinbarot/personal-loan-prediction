import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-shell";
import { DecisionComparison } from "@/components/overview/decision-comparison";
import { EngineeringCredibility } from "@/components/overview/engineering-credibility";
import { Hero } from "@/components/overview/hero";
import { HowItWorks } from "@/components/overview/how-it-works";
import { ResponsibleUse } from "@/components/overview/responsible-use";
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
      <Suspense fallback={null}>
        <EngineeringCredibility />
      </Suspense>
      <ResponsibleUse />
    </PageContainer>
  );
}
