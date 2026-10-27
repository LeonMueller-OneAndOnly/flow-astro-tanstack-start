import { Lock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * The demos that write server-side state (database rows, uploaded files, mail
 * jobs) only do so on the development server. `import.meta.env.DEV` is replaced
 * at build time, so a production build compiles the write paths out instead of
 * guarding them with a runtime flag that could be misconfigured.
 */
export const DEV_SERVER_ONLY_MESSAGE =
  "This demo only writes data on the development server. It is read-only in production.";

/** Shown in place of a demo's write controls in production builds. */
export function DevServerOnlyNotice({ className }: { className?: string }) {
  return (
    <Alert className={className}>
      <Lock className="absolute top-3.5 left-4 size-4" />
      <AlertTitle className="pl-7">Disabled in production</AlertTitle>
      <AlertDescription className="pl-7">{DEV_SERVER_ONLY_MESSAGE}</AlertDescription>
    </Alert>
  );
}
