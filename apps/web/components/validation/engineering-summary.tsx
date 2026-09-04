import { CheckIcon } from "lucide-react";

import { engineeringFacts, engineeringPractices } from "@/lib/engineering";
import { formatCount } from "@/lib/format";

export function EngineeringSummary() {
  const counts = [
    { label: "Python tests", value: formatCount(engineeringFacts.pythonTests), detail: `${engineeringFacts.mlPackageTests} model package · ${engineeringFacts.apiTests} API` },
    { label: "Frontend tests", value: formatCount(engineeringFacts.frontendTests), detail: "Vitest + Testing Library" },
    { label: "Continuous integration", value: engineeringFacts.ciConfigured ? "Configured" : "Not yet configured", detail: engineeringFacts.ciConfigured ? "Runs on every push" : "Planned; tests run locally today" },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {counts.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{item.label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{item.value}</dd>
            <dd className="text-xs text-muted-foreground">{item.detail}</dd>
          </div>
        ))}
      </dl>
      <ul className="grid gap-2 sm:grid-cols-2">
        {engineeringPractices.map((practice) => (
          <li key={practice.title} className="flex items-start gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success" aria-hidden>
              <CheckIcon className="size-3" />
            </span>
            <div>
              <p className="text-sm font-medium">{practice.title}</p>
              <p className="text-xs text-muted-foreground">{practice.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
