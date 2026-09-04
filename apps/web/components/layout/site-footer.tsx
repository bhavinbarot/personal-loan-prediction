import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="max-w-prose">
          {siteConfig.shortName} estimates likelihood of responding to a marketing campaign. It is not a credit,
          eligibility, approval, or default-risk model. Demo profiles are synthetic.
        </p>
        <a
          href={siteConfig.repositoryUrl}
          className="inline-flex min-h-9 items-center rounded-md font-medium text-foreground/80 underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          target="_blank"
          rel="noreferrer"
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
