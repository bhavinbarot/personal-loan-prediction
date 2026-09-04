import { PageContainer } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/site";

export default function OverviewPage() {
  return (
    <PageContainer>
      <section className="py-12 sm:py-16 lg:py-20" aria-labelledby="hero-title">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">{siteConfig.name}</p>
        <h1 id="hero-title" className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          {siteConfig.tagline}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">{siteConfig.description}</p>
      </section>
      <section className="pb-16" aria-label="Validated result loading">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </section>
    </PageContainer>
  );
}
