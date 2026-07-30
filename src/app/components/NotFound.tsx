import { buttonVariants } from "@/components/ui/button";
import { $astroPath } from "../lib/framework/typesafe-paths";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-24">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Error 404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        This page has wandered off.
      </h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        The address does not point to anything in this app. Head back to the start and try again.
      </p>
      <a href={$astroPath({ to: "/" })} className={`${buttonVariants()} mt-8`}>
        Return home
      </a>
    </main>
  );
}
