import { ArrowRightIcon, ChevronDownIcon, ListOrderedIcon, MegaphoneIcon, PercentIcon, SlidersHorizontalIcon, UserRoundIcon } from "lucide-react";
import { Fragment } from "react";

import { Section } from "@/components/layout/page-shell";

const steps = [
  { title: "Customer attributes", detail: "Income, spending, tenure, household, and product relationships", icon: UserRoundIcon },
  { title: "Response propensity", detail: "The model estimates each customer's likelihood of responding", icon: PercentIcon },
  { title: "Rank customers", detail: "Customers are ordered from most to least likely", icon: ListOrderedIcon },
  { title: "Apply campaign capacity", detail: "Only the top fraction the team can reach is kept", icon: SlidersHorizontalIcon },
  { title: "Prioritized outreach", detail: "The campaign team works the shortlist first", icon: MegaphoneIcon },
];

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="From customer attributes to a prioritized outreach list"
      description="No machine-learning background is needed to use the output: the result is an ordered list sized to the campaign."
    >
      <ol className="flex flex-col gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch lg:gap-0">
        {steps.map((step, index) => (
          <Fragment key={step.title}>
            <li className="relative flex gap-3 rounded-xl border border-border bg-card p-4 lg:flex-col lg:gap-3 lg:p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  <span className="text-muted-foreground">{index + 1}. </span>
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{step.detail}</p>
              </div>
            </li>
            {index < steps.length - 1 ? (
              <li aria-hidden className="flex items-center justify-center text-muted-foreground lg:mx-1">
                <ChevronDownIcon className="size-4 lg:hidden" />
                <ArrowRightIcon className="hidden size-4 lg:block" />
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
    </Section>
  );
}
