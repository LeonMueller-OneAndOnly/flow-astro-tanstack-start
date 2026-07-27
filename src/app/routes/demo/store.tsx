import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { brandPageBackground } from "@/lib/brand-theme";
import { demoStore } from "@/lib/demo/demo-store";

const fieldClass =
  "w-full rounded-lg border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-brand-primary-400 focus:border-brand-primary-500";

/** Served at `/app/demo/store`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/store")({
  component: DemoStore,
});

function FirstNameField() {
  const firstName = useStore(demoStore, (state) => state.firstName);
  return (
    <div className="space-y-1.5">
      <Label id="firstName-label" htmlFor="firstName">
        First name
      </Label>
      <input
        id="firstName"
        aria-labelledby="firstName-label"
        type="text"
        value={firstName}
        onChange={(e) => demoStore.setState((state) => ({ ...state, firstName: e.target.value }))}
        className={fieldClass}
      />
    </div>
  );
}

function LastNameField() {
  const lastName = useStore(demoStore, (state) => state.lastName);
  return (
    <div className="space-y-1.5">
      <Label id="lastName-label" htmlFor="lastName">
        Last name
      </Label>
      <input
        id="lastName"
        aria-labelledby="lastName-label"
        type="text"
        value={lastName}
        onChange={(e) => demoStore.setState((state) => ({ ...state, lastName: e.target.value }))}
        className={fieldClass}
      />
    </div>
  );
}

function FullNameField() {
  const fName = useStore(demoStore, (s) => `${s.firstName} ${s.lastName}`);
  return (
    <div className="space-y-1.5">
      <Label className="gap-2">
        Full name
        <Badge variant="secondary">derived</Badge>
      </Label>
      <output className="block w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-2 text-base text-foreground">
        {fName}
      </output>
    </div>
  );
}

function DemoStore() {
  return (
    <div
      className="flex min-h-[calc(100vh-32px)] w-full items-center justify-center bg-background p-8 text-foreground"
      style={brandPageBackground}
    >
      <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
        <BackLink to="/demo" />
        <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-brand-secondary-700">
          Client store
        </p>
        <h1 className="mb-5 text-3xl font-bold tracking-tight">Reactive store</h1>
        <DemoExplainer feature="TanStack Store + derived state">
          Each field subscribes to its own slice with <code>useStore</code>, so typing in one input
          re-renders only that field. <code>Full name</code> is a <code>Derived</code> value that
          recomputes automatically whenever either name changes — no manual wiring.
        </DemoExplainer>
        <div className="space-y-4">
          <FirstNameField />
          <LastNameField />
          <FullNameField />
        </div>
      </div>
    </div>
  );
}
