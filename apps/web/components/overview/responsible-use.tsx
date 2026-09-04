import { InfoIcon } from "lucide-react";

const notDetermined = ["creditworthiness", "lending eligibility", "loan approval", "default risk"];

export function ResponsibleUse() {
  return (
    <section aria-labelledby="responsible-use-title" className="py-8 sm:py-10">
      <div className="rounded-xl border border-border bg-muted/40 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
            <InfoIcon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="responsible-use-title" className="text-base font-semibold">
              Responsible use
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This application estimates likelihood of responding to a marketing campaign. It does not determine:
            </p>
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="What the model does not determine">
              {notDetermined.map((item) => (
                <li key={item} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Synthetic profiles are used in the public demo. The original course dataset is not exposed by the
              application.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
