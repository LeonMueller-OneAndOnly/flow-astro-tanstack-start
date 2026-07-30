import { Link, type LinkProps } from "@tanstack/react-router";

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Guitar,
  LayoutGrid,
  Menu,
  Network,
  SquareFunction,
  StickyNote,
  Store,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { $appPath, $astroPath } from "../lib/framework/typesafe-paths";

/**
 * `app`: rendered inside the TanStack Start shell (`__root.tsx`) where a router
 * context exists, so nav uses client-side `Link`s with active highlighting.
 * `site`: rendered as an Astro island on the static homepage, which has no
 * router context, so nav falls back to plain anchors.
 *
 * Both variants render the real shadcn `Sidebar` (mobile Sheet + desktop
 * slide-in panel) styled with the `--sidebar-*` palette from globals.css.
 */
type HeaderVariant = "app" | "site";

/** Active-route classes mirroring the sidebar's own `data-[active=true]` look. */
const NAV_ACTIVE_CLASS = "bg-sidebar-accent font-medium text-sidebar-accent-foreground";

/**
 * The fixed top bar. Lives inside `SidebarProvider` so it can toggle the
 * sidebar via context. `z-20` keeps the hamburger above the desktop slide-in
 * panel (`z-10`) so it stays clickable to close.
 */
function MenuBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-2 bg-brand-primary-950 px-4 text-white shadow-lg">
      <button
        type="button"
        aria-label="Toggle menu"
        onClick={toggleSidebar}
        className="rounded-md p-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Menu className="size-6" />
      </button>
      <a
        href={$astroPath({ to: "/" })}
        className="ml-1 text-xl font-semibold tracking-tight text-white"
      >
        Omnis
      </a>
    </header>
  );
}

/**
 * A top-level menu entry. `href` is precomputed via `$appPath` at the literal
 * call site so the route stays type-checked; `to` drives the in-app `Link`.
 */
function NavButton({
  variant,
  to,
  href,
  onNavigate,
  icon,
  label,
}: {
  variant: HeaderVariant;
  to: LinkProps["to"];
  href: string;
  onNavigate: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <SidebarMenuButton asChild>
      {variant === "site" ? (
        <a href={href}>
          {icon}
          <span>{label}</span>
        </a>
      ) : (
        <Link to={to} onClick={onNavigate} activeProps={{ className: NAV_ACTIVE_CLASS }}>
          {icon}
          <span>{label}</span>
        </Link>
      )}
    </SidebarMenuButton>
  );
}

/** A nested entry under a collapsible group (e.g. the SSR demos). */
function NavSubButton({
  variant,
  to,
  href,
  onNavigate,
  label,
}: {
  variant: HeaderVariant;
  to: LinkProps["to"];
  href: string;
  onNavigate: () => void;
  label: string;
}) {
  return (
    <SidebarMenuSubButton asChild>
      {variant === "site" ? (
        <a href={href}>
          <span>{label}</span>
        </a>
      ) : (
        <Link to={to} onClick={onNavigate} activeProps={{ className: NAV_ACTIVE_CLASS }}>
          <span>{label}</span>
        </Link>
      )}
    </SidebarMenuSubButton>
  );
}

function AppSidebar({ variant }: { variant: HeaderVariant }) {
  const { setOpen, setOpenMobile } = useSidebar();
  const [ssrOpen, setSsrOpen] = useState(false);
  const close = () => {
    setOpen(false);
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas" className="pt-14">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-2 py-1.5 text-sm font-semibold text-sidebar-foreground">Navigation</div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Demos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavButton
                  variant={variant}
                  to="/demo"
                  href={$appPath({ to: "/demo" })}
                  onNavigate={close}
                  icon={<LayoutGrid />}
                  label="All Demos"
                />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton
                  variant={variant}
                  to="/demo/start/server-funcs"
                  href={$appPath({ to: "/demo/start/server-funcs" })}
                  onNavigate={close}
                  icon={<SquareFunction />}
                  label="Server Functions"
                />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton
                  variant={variant}
                  to="/demo/start/api-request"
                  href={$appPath({ to: "/demo/start/api-request" })}
                  onNavigate={close}
                  icon={<Network />}
                  label="API Request"
                />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton
                  variant={variant}
                  to="/demo/start/ssr"
                  href={$appPath({ to: "/demo/start/ssr" })}
                  onNavigate={close}
                  icon={<StickyNote />}
                  label="SSR Demos"
                />
                <SidebarMenuAction
                  onClick={() => setSsrOpen((value) => !value)}
                  aria-label="Toggle SSR demos"
                  aria-expanded={ssrOpen}
                >
                  {ssrOpen ? <ChevronDown /> : <ChevronRight />}
                </SidebarMenuAction>
                {ssrOpen && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <NavSubButton
                        variant={variant}
                        to="/demo/start/ssr/spa-mode"
                        href={$appPath({ to: "/demo/start/ssr/spa-mode" })}
                        onNavigate={close}
                        label="SPA Mode"
                      />
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <NavSubButton
                        variant={variant}
                        to="/demo/start/ssr/full-ssr"
                        href={$appPath({ to: "/demo/start/ssr/full-ssr" })}
                        onNavigate={close}
                        label="Full SSR"
                      />
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <NavSubButton
                        variant={variant}
                        to="/demo/start/ssr/data-only"
                        href={$appPath({ to: "/demo/start/ssr/data-only" })}
                        onNavigate={close}
                        label="Data Only"
                      />
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton
                  variant={variant}
                  to="/demo/example/guitars"
                  href={$appPath({ to: "/demo/example/guitars" })}
                  onNavigate={close}
                  icon={<Guitar />}
                  label="Guitar Demo"
                />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton
                  variant={variant}
                  to="/demo/store"
                  href={$appPath({ to: "/demo/store" })}
                  onNavigate={close}
                  icon={<Store />}
                  label="Store"
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <p className="px-2 py-1 text-xs text-sidebar-foreground/60">
          Placeholder starter content. Replace these demos with the real app when ready.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function Header({ variant = "app" }: { variant?: HeaderVariant }) {
  return (
    <SidebarProvider defaultOpen={false} className="min-h-0 flex-col">
      <MenuBar />
      <div aria-hidden="true" className="h-14 shrink-0" />
      <AppSidebar variant={variant} />
    </SidebarProvider>
  );
}
