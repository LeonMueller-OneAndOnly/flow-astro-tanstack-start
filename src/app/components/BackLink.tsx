import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Consistent "back" navigation for demo sub-pages. Renders a TanStack `Link`
 * (these pages run inside the app router), so `to` stays type-checked.
 */
export function BackLink({
  to,
  label = "Back to demos",
  className,
}: {
  to: LinkProps["to"];
  label?: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full bg-secondary py-1.5 pr-4 pl-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-border hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}
