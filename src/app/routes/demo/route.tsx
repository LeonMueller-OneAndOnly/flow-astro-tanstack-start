import { Link, Outlet, createFileRoute, type LinkProps } from "@tanstack/react-router";

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Guitar,
  House,
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
import { $astroPath } from "@/lib/framework/typesafe-paths";

/**
 * The chrome around `/app/demo/*` — a top bar and the offcanvas demo navigation.
 *
 * It lives here rather than in `__root.tsx` so it wraps the starter demos and
 * nothing else: a real page added under `/app` starts without this navigation,
 * and deleting `src/app/routes/demo` takes the whole shell with it. The Astro
 * pages render no sidebar at all; they are plain content pages.
 */
export const Route = createFileRoute("/demo")({
  component: DemoLayout,
});

/** Active-route classes mirroring the sidebar's own `data-[active=true]` look. */
const NAV_ACTIVE_CLASS = "bg-sidebar-accent font-medium text-sidebar-accent-foreground";

function DemoLayout() {
  return (
    <SidebarProvider defaultOpen={false} className="min-h-0 flex-col">
      <MenuBar />
      <div aria-hidden="true" className="h-header shrink-0" />
      <DemoSidebar />
      {/*
       * Demo content gets its own stacking context via `isolate`, so any z-index a
       * demo sets stays self-contained and can never paint over the chrome — the
       * MenuBar (z-20) and the offcanvas Sidebar (z-10) sit outside this wrapper
       * and must always stay on top.
       */}
      <div className="isolate">
        <Outlet />
      </div>
    </SidebarProvider>
  );
}

/**
 * The fixed top bar. Lives inside `SidebarProvider` so it can toggle the
 * sidebar via context. `z-20` keeps the hamburger above the desktop slide-in
 * panel (`z-10`) so it stays clickable to close.
 */
function MenuBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-header items-center gap-1 border-b border-border bg-background/60 px-4 backdrop-blur-xl">
      <button
        type="button"
        aria-label="Toggle menu"
        onClick={toggleSidebar}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Menu className="size-5" />
      </button>
      <a href={$astroPath({ to: "/" })} className="px-1 font-semibold tracking-tight">
        Omvin
      </a>
    </header>
  );
}

/** A top-level menu entry; `to` is type-checked against the app's route tree. */
function NavButton({
  to,
  onNavigate,
  icon,
  label,
}: {
  to: LinkProps["to"];
  onNavigate: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <SidebarMenuButton asChild>
      <Link to={to} onClick={onNavigate} activeProps={{ className: NAV_ACTIVE_CLASS }}>
        {icon}
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  );
}

/** A nested entry under a collapsible group (e.g. the SSR demos). */
function NavSubButton({
  to,
  onNavigate,
  label,
}: {
  to: LinkProps["to"];
  onNavigate: () => void;
  label: string;
}) {
  return (
    <SidebarMenuSubButton asChild>
      <Link to={to} onClick={onNavigate} activeProps={{ className: NAV_ACTIVE_CLASS }}>
        <span>{label}</span>
      </Link>
    </SidebarMenuSubButton>
  );
}

function DemoSidebar() {
  const { setOpen, setOpenMobile } = useSidebar();
  const [ssrOpen, setSsrOpen] = useState(false);
  const close = () => {
    setOpen(false);
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas" className="pt-header">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-2 py-1.5 text-sm font-semibold text-sidebar-foreground">Navigation</div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {/* Leaves the TanStack router for the Astro side, so a plain anchor
                    and a full document load — a `Link` would only ever 404 here. */}
                <SidebarMenuButton asChild>
                  <a href={$astroPath({ to: "/" })}>
                    <House />
                    <span>Homepage</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Demos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavButton to="/demo" onNavigate={close} icon={<LayoutGrid />} label="All Demos" />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton
                  to="/demo/start/server-funcs"
                  onNavigate={close}
                  icon={<SquareFunction />}
                  label="Server Functions"
                />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton
                  to="/demo/start/api-request"
                  onNavigate={close}
                  icon={<Network />}
                  label="API Request"
                />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton
                  to="/demo/start/ssr"
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
                        to="/demo/start/ssr/spa-mode"
                        onNavigate={close}
                        label="SPA Mode"
                      />
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <NavSubButton
                        to="/demo/start/ssr/full-ssr"
                        onNavigate={close}
                        label="Full SSR"
                      />
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <NavSubButton
                        to="/demo/start/ssr/data-only"
                        onNavigate={close}
                        label="Data Only"
                      />
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton
                  to="/demo/example/guitars"
                  onNavigate={close}
                  icon={<Guitar />}
                  label="Guitar Demo"
                />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavButton to="/demo/store" onNavigate={close} icon={<Store />} label="Store" />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <p className="px-2 py-1 text-xs text-sidebar-foreground/60">
          Starter scaffolding. Delete <code>src/app/routes/demo</code> to drop the demos and this
          navigation with them.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
