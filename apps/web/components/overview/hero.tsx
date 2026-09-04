import { ArrowRightIcon } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="pt-12 pb-8 sm:pt-16 sm:pb-10 lg:pt-20" aria-labelledby="hero-title">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">{siteConfig.name}</p>
      <h1
        id="hero-title"
        className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl"
      >
        Reach fewer customers.
        <br />
        Capture more likely responders.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">{siteConfig.description}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
        <LinkButton href="/simulator" size="lg" className="h-11 px-5 sm:h-10">
          Open the campaign simulator
          <ArrowRightIcon data-icon="inline-end" aria-hidden />
        </LinkButton>
        <LinkButton href="/validation" size="lg" variant="outline" className="h-11 px-5 sm:h-10">
          Review technical validation
        </LinkButton>
      </div>
    </section>
  );
}
