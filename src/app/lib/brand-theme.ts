import type { CSSProperties } from "react";

/**
 * Shared brand page background — the hero gradient from the homepage
 * (`src/app/routes/index.tsx`), reused across the homepage and the demo pages so
 * the whole product reads as one. Built on the `--brand-*` tokens in
 * `src/styles/globals.css`. The homepage reads `.background`; other pages spread
 * the object.
 */
export const brandPageBackground = {
  background: [
    "radial-gradient(circle at 12% 10%, color-mix(in oklch, var(--brand-primary-400) 22%, transparent), transparent 32rem)",
    "radial-gradient(circle at 85% 18%, color-mix(in oklch, var(--brand-secondary-500) 18%, transparent), transparent 30rem)",
    "linear-gradient(135deg, oklch(0.985 0.02 86), oklch(0.96 0.025 68) 42%, var(--background))",
  ].join(","),
} satisfies CSSProperties;

/**
 * Primary button styling that mirrors the homepage CTA (`.btnPrimary` in
 * `src/app/routes/index.module.css`): a dark foreground pill with a soft shadow and a
 * hover lift. Append layout classes (radius, padding, width) at the call site.
 */
export const brandPrimaryButtonClass =
  "bg-foreground text-background font-bold shadow-[0_18px_36px_color-mix(in_oklch,var(--foreground)_18%,transparent)] transition-all hover:-translate-y-0.5 hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0";
