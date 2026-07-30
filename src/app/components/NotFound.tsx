import { Link } from "@tanstack/react-router";

import { brandPageBackground, brandPrimaryButtonClass } from "../lib/brand-theme";

export default function NotFound() {
  return (
    <main
      className="flex min-h-[calc(100dvh-60px)] items-center px-4 py-12 sm:px-8"
      style={brandPageBackground}
    >
      <section className="mx-auto w-full max-w-3xl text-center">
        <p className="mb-4 text-sm font-black tracking-[0.18em] text-brand-secondary-700 uppercase">
          Error 404
        </p>
        <h1 className="m-0 text-6xl leading-[0.92] font-black tracking-[-0.06em] sm:text-8xl">
          This page has wandered off.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-foreground/68 sm:text-xl">
          The address does not point to anything in this app. Head back to the start and try again.
        </p>
        <Link
          to="/"
          className={`${brandPrimaryButtonClass} mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-6 no-underline`}
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
