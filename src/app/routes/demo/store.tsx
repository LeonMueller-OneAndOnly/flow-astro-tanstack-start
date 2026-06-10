import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";

import { demoPageBackground } from "@/lib/demo/demo-theme";
import { fullName, store } from "@/lib/demo/demo-store";

const fieldClass =
  "rounded-lg border border-border bg-card px-4 py-2 text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground hover:border-brand-primary-400 focus:border-brand-primary-500";

/** Served at `/app/demo/store`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/store")({
  component: DemoStore,
});

function FirstName() {
  const firstName = useStore(store, (state) => state.firstName);
  return (
    <input
      aria-label="First name"
      type="text"
      value={firstName}
      onChange={(e) => store.setState((state) => ({ ...state, firstName: e.target.value }))}
      className={fieldClass}
    />
  );
}

function LastName() {
  const lastName = useStore(store, (state) => state.lastName);
  return (
    <input
      aria-label="Last name"
      type="text"
      value={lastName}
      onChange={(e) => store.setState((state) => ({ ...state, lastName: e.target.value }))}
      className={fieldClass}
    />
  );
}

function FullName() {
  const fName = useStore(fullName);
  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-2 text-foreground">
      {fName}
    </div>
  );
}

function DemoStore() {
  return (
    <div
      className="flex h-full min-h-[calc(100vh-32px)] w-full items-center justify-center bg-background p-8 text-foreground"
      style={demoPageBackground}
    >
      <div className="flex min-w-1/2 flex-col gap-4 rounded-2xl border border-foreground/10 bg-card/80 p-8 text-3xl shadow-xl backdrop-blur-sm">
        <h1 className="mb-5 text-4xl font-bold tracking-tight">Store example</h1>
        <FirstName />
        <LastName />
        <FullName />
      </div>
    </div>
  );
}
