import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Short "what framework feature this demo shows" callout, shared across the
 * demo pages so each one explains itself consistently. `feature` names the
 * TanStack Start / Astro capability; children carry the one-line explanation.
 */
export function DemoExplainer({
  feature,
  children,
  className,
}: {
  feature: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-l-2 border-primary/40 pl-4", className)}>
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{feature}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
