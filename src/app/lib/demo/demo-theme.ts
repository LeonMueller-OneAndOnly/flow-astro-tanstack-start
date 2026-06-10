import type { CSSProperties } from "react";

/**
 * Shared brand background for demo pages. Mirrors the hero gradient on the
 * Astro homepage (`src/pages/index.astro`) so every demo reads as the same
 * product. Built on the `--brand-*` tokens in `src/styles/globals.css`.
 */
export const demoPageBackground: CSSProperties = {
  background: [
    "radial-gradient(circle at 12% 10%, color-mix(in oklch, var(--brand-primary-400) 22%, transparent), transparent 32rem)",
    "radial-gradient(circle at 85% 18%, color-mix(in oklch, var(--brand-secondary-500) 18%, transparent), transparent 30rem)",
    "linear-gradient(135deg, oklch(0.985 0.02 86), oklch(0.96 0.025 68) 42%, var(--background))",
  ].join(","),
};
