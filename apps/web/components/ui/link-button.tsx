import Link from "next/link";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

type LinkButtonProps = Omit<ComponentProps<typeof Button>, "render" | "nativeButton"> & {
  href: ComponentProps<typeof Link>["href"];
  target?: string;
  rel?: string;
};

/** A Next.js link styled as a button. Keeps anchor semantics so Base UI does not expect a native button. */
export function LinkButton({ href, target, rel, ...props }: LinkButtonProps) {
  return <Button nativeButton={false} render={<Link href={href} target={target} rel={rel} />} {...props} />;
}
