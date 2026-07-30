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

/**
 * Renders the real shadcn `Sidebar` (mobile Sheet + desktop slide-in panel)
 * styled with the `--sidebar-*` palette from globals.css. Every route lives
 * inside the router, so nav is always client-side `Link`s with active
 * highlighting — the previous `site` variant existed only for the Astro
 * homepage, which had no router context.
 */

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
      <Link to="/" className="ml-1 text-xl font-semibold tracking-tight text-white">
        Omnis
      </Link>
    </header>
  );
}

/** A top-level menu entry. `to` is type-checked against the generated route tree. */
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

function AppSidebar() {
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
                  to="/demo"
                  onNavigate={close}
                  icon={<LayoutGrid />}
                  label="All Demos"
                />
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
                <NavButton
                  to="/demo/store"
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

export default function Header() {
  return (
    <SidebarProvider defaultOpen={false} className="min-h-0 flex-col">
      <MenuBar />
      <div aria-hidden="true" className="h-14 shrink-0" />
      <AppSidebar />
    </SidebarProvider>
  );
}
