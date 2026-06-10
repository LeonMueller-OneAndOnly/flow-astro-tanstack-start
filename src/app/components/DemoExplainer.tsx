import { Lightbulb } from "lucide-react";
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
    <div
      className={cn(
        "mb-6 flex gap-3 rounded-xl border border-brand-secondary-500/30 bg-brand-secondary-500/10 p-4",
        className,
      )}
    >
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand-secondary-600" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{feature}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
