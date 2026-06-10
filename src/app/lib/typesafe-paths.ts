import { defaultStringifySearch, interpolatePath } from "@tanstack/react-router";
import type { LinkOptions, RegisteredRouter } from "@tanstack/react-router";
import type { FileRouteTypes } from "../routeTree.gen";

import { $path, type RouteId, type RouteOptions } from "astro-typesafe-routes/path";

export function $astroPath<T extends RouteId>(args: RouteOptions<T>) {
  return $path(args);
}

const APP_BASE_PATH = "/app";

/**
 * @example $appPath({ to: "/demo/start/ssr" })
 */
export function $appPath<const TTo extends AppRouteTo>(
  options: TanStackStartPathOptions<TTo>,
): string {
  const params = toPlainRecord("params", "params" in options ? options.params : undefined);
  const { interpolatedPath, isMissingParams } = interpolatePath({
    path: options.to,
    params,
  });

  if (isMissingParams) {
    throw new Error(`Missing params for TanStack Start route: ${options.to}`);
  }

  const path = interpolatedPath === "/" ? "" : interpolatedPath;
  const search = toSearch("search" in options ? options.search : undefined);
  const hash = toHash(options.hash);

  return `${APP_BASE_PATH}${path}${search}${hash}`;
}

type Updater = (...args: never[]) => unknown;
type StaticValue<TValue> = Exclude<TValue, true | Updater>;
type AppRouteTo = FileRouteTypes["to"];

type AppLinkOptions<TTo extends AppRouteTo> = LinkOptions<RegisteredRouter, string, TTo>;

type ParamsOption<TTo extends AppRouteTo> =
  AppLinkOptions<TTo> extends {
    params: infer TParams;
  }
    ? { params: StaticValue<TParams> }
    : AppLinkOptions<TTo> extends { params?: infer TParams }
      ? { params?: StaticValue<TParams> }
      : Record<string, never>;

type SearchOption<TTo extends AppRouteTo> =
  AppLinkOptions<TTo> extends {
    search: infer TSearch;
  }
    ? { search: StaticValue<TSearch> }
    : AppLinkOptions<TTo> extends { search?: infer TSearch }
      ? { search?: StaticValue<TSearch> }
      : Record<string, never>;

type TanStackStartPathOptions<TTo extends AppRouteTo> = { to: TTo } & ParamsOption<TTo> &
  SearchOption<TTo> & {
    hash?: string;
  };

function toPlainRecord(name: string, value: unknown): Record<string, unknown> {
  if (value == null) {
    return {};
  }

  if (value === true || typeof value === "function" || typeof value !== "object") {
    throw new Error(`$appPath only supports static ${name} objects.`);
  }

  return value as Record<string, unknown>;
}

function toSearch(value: unknown): string {
  const search = toPlainRecord("search", value);
  return defaultStringifySearch(search);
}

function toHash(hash: string | undefined): string {
  if (!hash) {
    return "";
  }

  return hash.startsWith("#") ? hash : `#${hash}`;
}
