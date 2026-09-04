import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Technical Validation",
  description: "Model comparison, untouched holdout performance, campaign metrics, and evaluation methodology.",
};

export default function ValidationPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Evidence"
        title="Technical Validation"
        description="How the model was selected, how it performed on untouched data, and how the evaluation was kept leakage-safe."
      />
      <div className="grid gap-4 pb-16 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </PageContainer>
  );
}
