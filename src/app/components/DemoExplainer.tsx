import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Short "what framework feature this demo shows" callout, shared across the
 * demo pages so each one explains itself consistently. `feature` names the
 * TanStack Start / Astro capability; children carry the one-line explanation.
 *
 * Tinted rather than bordered, because it sits among cards that are already
 * bordered — another outlined box would read as one more piece of the demo
 * rather than as an aside about it.
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
    <aside className={cn("flex gap-4 rounded-xl bg-brand-soft p-5", className)}>
      <span
        className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-primary-foreground"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      </span>
      <div>
        <p className="font-semibold text-brand-ink">{feature}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">{children}</p>
      </div>
    </aside>
  );
}
