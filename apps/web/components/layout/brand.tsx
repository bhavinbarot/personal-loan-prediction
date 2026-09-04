import { RadarIcon } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { cn } from "cn";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-md text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      aria-label={`${siteConfig.name} home`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <RadarIcon className="size-4" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold tracking-tight">{siteConfig.shortName}</span>
        <span className="hidden truncate text-[11px] text-muted-foreground sm:block">Personal loan outreach prioritization</span>
      </span>
    </Link>
  );
}
