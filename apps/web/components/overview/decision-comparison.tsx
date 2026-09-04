import { CheckIcon, MinusIcon } from "lucide-react";

import { Section } from "@/components/layout/page-shell";
import { cn } from "cn";

const withoutTargeting = ["Broad outreach to the whole customer base", "Higher contact volume for the same responders", "Lower targeting efficiency"];

const modelRanked = [
  "Score every customer's likelihood of responding",
  "Rank customers by response propensity",
  "Apply the campaign's contact capacity",
  "Focus outreach on the highest-ranked customers",
];

export function DecisionComparison() {
  return (
    <Section
      id="decision"
      eyebrow="The decision"
      title="If the team can only contact a fraction of customers, who should be first?"
      description="Marketing capacity is limited. The system turns that constraint into a ranked outreach list instead of a blanket campaign."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ComparisonCard title="Without targeting" tone="muted" items={withoutTargeting} icon={MinusIcon} />
        <ComparisonCard title="Model-ranked campaign" tone="primary" items={modelRanked} icon={CheckIcon} ordered />
      </div>
    </Section>
  );
}

function ComparisonCard({
  title,
  items,
  tone,
  icon: Icon,
  ordered = false,
}: {
  title: string;
  items: string[];
  tone: "muted" | "primary";
  icon: typeof CheckIcon;
  ordered?: boolean;
}) {
  const List = ordered ? "ol" : "ul";
  return (
    <div
      className={cn(
        "rounded-xl border p-5 sm:p-6",
        tone === "primary" ? "border-primary/30 bg-primary/5 dark:bg-primary/10" : "border-border bg-card",
      )}
    >
      <h3 className="text-base font-semibold">{title}</h3>
      <List className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex items-start gap-3 text-sm sm:text-[15px]">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                tone === "primary" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
              aria-hidden
            >
              {ordered ? index + 1 : <Icon className="size-3" />}
            </span>
            <span className={tone === "primary" ? "text-foreground" : "text-muted-foreground"}>{item}</span>
          </li>
        ))}
      </List>
    </div>
  );
}
