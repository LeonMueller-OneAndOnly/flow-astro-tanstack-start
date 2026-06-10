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
  X,
} from "lucide-react";

import { $appPath, $astroPath } from "../lib/typesafe-paths";

/**
 * `app`: rendered inside the TanStack Start shell (`__root.tsx`) where a router
 * context exists, so nav uses client-side `Link`s with active highlighting.
 * `site`: rendered as an Astro island on the static homepage, which has no
 * router context, so nav falls back to plain anchors.
 */
type HeaderVariant = "app" | "site";

const NAV_LINK_CLASS =
  "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2";
const NAV_LINK_ACTIVE_CLASS =
  "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2";
const NAV_GROUP_LINK_CLASS = `flex-1 ${NAV_LINK_CLASS}`;
const NAV_GROUP_LINK_ACTIVE_CLASS = `flex-1 ${NAV_LINK_ACTIVE_CLASS}`;

/**
 * One sidebar entry. `href` is precomputed by the caller via `$appPath` at the
 * literal call site so the route stays type-checked; `to` drives the in-app
 * `Link`. The two name the same route.
 */
function NavLink({
  variant,
  to,
  href,
  onNavigate,
  className = NAV_LINK_CLASS,
  activeClassName = NAV_LINK_ACTIVE_CLASS,
  children,
}: {
  variant: HeaderVariant;
  to: LinkProps["to"];
  href: string;
  onNavigate: () => void;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
}) {
  if (variant === "site") {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={className}
      activeProps={{ className: activeClassName }}
    >
      {children}
    </Link>
  );
}

export default function Header({ variant = "app" }: { variant?: HeaderVariant }) {
  const [isOpen, setIsOpen] = useState(false);
  const [groupedExpanded, setGroupedExpanded] = useState<Record<string, boolean>>({});
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 text-xl font-semibold">
          <a href={$astroPath({ to: "/" })}>
            <img
              src="/images/demo/flowoffice-schritmarke-light.svg"
              alt="FlowOffice"
              className="h-3.5 sm:h-4 w-auto"
            />
          </a>
        </h1>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={closeMenu}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <NavLink
            variant={variant}
            to="/demo"
            href={$appPath({ to: "/demo" })}
            onNavigate={closeMenu}
          >
            <LayoutGrid size={20} />
            <span className="font-medium">All Demos</span>
          </NavLink>

          <NavLink
            variant={variant}
            to="/demo/start/server-funcs"
            href={$appPath({ to: "/demo/start/server-funcs" })}
            onNavigate={closeMenu}
          >
            <SquareFunction size={20} />
            <span className="font-medium">Start - Server Functions</span>
          </NavLink>

          <NavLink
            variant={variant}
            to="/demo/start/api-request"
            href={$appPath({ to: "/demo/start/api-request" })}
            onNavigate={closeMenu}
          >
            <Network size={20} />
            <span className="font-medium">Start - API Request</span>
          </NavLink>

          <div className="flex flex-row justify-between">
            <NavLink
              variant={variant}
              to="/demo/start/ssr"
              href={$appPath({ to: "/demo/start/ssr" })}
              onNavigate={closeMenu}
              className={NAV_GROUP_LINK_CLASS}
              activeClassName={NAV_GROUP_LINK_ACTIVE_CLASS}
            >
              <StickyNote size={20} />
              <span className="font-medium">Start - SSR Demos</span>
            </NavLink>
            <button
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() =>
                setGroupedExpanded((prev) => ({
                  ...prev,
                  StartSSRDemo: !prev.StartSSRDemo,
                }))
              }
            >
              {groupedExpanded.StartSSRDemo ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>
          {groupedExpanded.StartSSRDemo && (
            <div className="flex flex-col ml-4">
              <NavLink
                variant={variant}
                to="/demo/start/ssr/spa-mode"
                href={$appPath({ to: "/demo/start/ssr/spa-mode" })}
                onNavigate={closeMenu}
              >
                <StickyNote size={20} />
                <span className="font-medium">SPA Mode</span>
              </NavLink>

              <NavLink
                variant={variant}
                to="/demo/start/ssr/full-ssr"
                href={$appPath({ to: "/demo/start/ssr/full-ssr" })}
                onNavigate={closeMenu}
              >
                <StickyNote size={20} />
                <span className="font-medium">Full SSR</span>
              </NavLink>

              <NavLink
                variant={variant}
                to="/demo/start/ssr/data-only"
                href={$appPath({ to: "/demo/start/ssr/data-only" })}
                onNavigate={closeMenu}
              >
                <StickyNote size={20} />
                <span className="font-medium">Data Only</span>
              </NavLink>
            </div>
          )}

          <NavLink
            variant={variant}
            to="/demo/example/guitars"
            href={$appPath({ to: "/demo/example/guitars" })}
            onNavigate={closeMenu}
          >
            <Guitar size={20} />
            <span className="font-medium">Guitar Demo</span>
          </NavLink>

          <NavLink
            variant={variant}
            to="/demo/store"
            href={$appPath({ to: "/demo/store" })}
            onNavigate={closeMenu}
          >
            <Store size={20} />
            <span className="font-medium">Store</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-700 bg-gray-800 text-sm text-gray-300">
          Placeholder starter content. Replace these demos with the real app when ready.
        </div>
      </aside>
    </>
  );
}
