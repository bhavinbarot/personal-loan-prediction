import { PageContainer } from "@/components/layout/page-shell";
import { LinkButton } from "@/components/ui/link-button";

export default function NotFound() {
  return (
    <PageContainer className="py-20 text-center sm:py-28">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">This page does not exist</h1>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        The link may be outdated. Head back to the overview to continue exploring.
      </p>
      <div className="mt-6">
        <LinkButton href="/">Go to overview</LinkButton>
      </div>
    </PageContainer>
  );
}
