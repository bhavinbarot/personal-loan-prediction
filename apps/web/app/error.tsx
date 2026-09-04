"use client";

import { useEffect } from "react";

import { PageContainer } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer className="py-20 text-center sm:py-28">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        The page could not be rendered. This is usually temporary.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </PageContainer>
  );
}
