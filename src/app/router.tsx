import { createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

if (import.meta.env.DEV && typeof window !== "undefined" && import.meta.env.APP_ENV === "local") {
  void import("react-grab");
}

// Create a new router instance
export const getRouter = () => {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
};
