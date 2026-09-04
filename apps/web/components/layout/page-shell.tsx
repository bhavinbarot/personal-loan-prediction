import type { ReactNode } from "react";

import { cn } from "cn";

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 py-8 sm:py-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mb-2 text-xs font-semibold tracking-wide text-primary uppercase">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-base text-muted-foreground text-pretty">{description}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function Section({
  id,
  title,
  description,
  eyebrow,
  children,
  className,
  headingLevel = 2,
}: {
  id: string;
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("py-8 sm:py-10", className)}>
      <div className="mb-5 max-w-2xl sm:mb-6">
        {eyebrow ? <p className="mb-1.5 text-xs font-semibold tracking-wide text-primary uppercase">{eyebrow}</p> : null}
        <Heading id={`${id}-title`} className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </Heading>
        {description ? <p className="mt-1.5 text-sm text-muted-foreground text-pretty sm:text-base">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
