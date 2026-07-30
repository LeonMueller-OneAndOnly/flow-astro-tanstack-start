import { createFileRoute } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoStore } from "@/lib/demo/demo-store";

/** Served at `/app/demo/store`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/store")({
  component: DemoStore,
});

function FirstNameField() {
  const firstName = useSelector(demoStore, (state) => state.firstName);
  return (
    <div className="space-y-2">
      <Label htmlFor="firstName">First name</Label>
      <Input
        id="firstName"
        type="text"
        value={firstName}
        onChange={(e) => demoStore.setState((state) => ({ ...state, firstName: e.target.value }))}
      />
    </div>
  );
}

function LastNameField() {
  const lastName = useSelector(demoStore, (state) => state.lastName);
  return (
    <div className="space-y-2">
      <Label htmlFor="lastName">Last name</Label>
      <Input
        id="lastName"
        type="text"
        value={lastName}
        onChange={(e) => demoStore.setState((state) => ({ ...state, lastName: e.target.value }))}
      />
    </div>
  );
}

function FullNameField() {
  const fName = useSelector(demoStore, (s) => `${s.firstName} ${s.lastName}`);
  return (
    <div className="space-y-2">
      <Label className="gap-2">
        Full name
        <Badge variant="secondary">derived</Badge>
      </Label>
      <output className="block w-full rounded-md border border-border bg-muted px-3 py-2 text-base md:text-sm">
        {fName}
      </output>
    </div>
  );
}

function DemoStore() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-10 pb-24">
      <BackLink to="/demo" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Reactive store</h1>
      <DemoExplainer feature="TanStack Store + derived state" className="mt-6">
        Each field subscribes to its own slice with <code>useSelector</code>, so typing in one input
        re-renders only that field. <code>Full name</code> is a <code>Derived</code> value that
        recomputes automatically whenever either name changes — no manual wiring.
      </DemoExplainer>

      <div className="shadow-soft mt-8 space-y-5 rounded-xl border border-border bg-card p-6">
        <FirstNameField />
        <LastNameField />
        <FullNameField />
      </div>
    </main>
  );
}
