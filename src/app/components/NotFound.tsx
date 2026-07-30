import { buttonVariants } from "@/components/ui/button";
import { $astroPath } from "../lib/framework/typesafe-paths";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-24 text-center">
      <span
        className="inline-flex size-14 items-center justify-center rounded-2xl bg-tint-sun text-tint-sun-ink"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </span>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        This page has wandered off.
      </h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        The address does not point at anything in this app. No harm done — head back to the start
        and pick up from there.
      </p>
      <a href={$astroPath({ to: "/" })} className={`${buttonVariants({ size: "lg" })} mt-8`}>
        Take me home
        <span aria-hidden="true">→</span>
      </a>
    </main>
  );
}
