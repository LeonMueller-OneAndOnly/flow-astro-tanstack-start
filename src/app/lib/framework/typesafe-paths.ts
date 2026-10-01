import { defaultStringifySearch } from "@tanstack/react-router";
import type { FileRoutesByPath } from "@tanstack/react-router";

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
  const interpolatedPath = interpolate(options.to, params);

  const path = interpolatedPath === "/" ? "" : interpolatedPath;
  const search = toSearch("search" in options ? options.search : undefined);
  const hash = toHash(options.hash);

  return `${APP_BASE_PATH}${path}${search}${hash}`;
}

type FileRoutePath = Extract<keyof FileRoutesByPath, string>;
type AppRouteTo =
  | "/"
  | FileRoutePath
  | TrimIndexRoute<FileRoutePath>
  | TrimSplatRoute<FileRoutePath>;
type PathParamValue = string | number | boolean;

type TrimIndexRoute<TPath extends string> = TPath extends `${infer TPrefix}/` ? TPrefix : TPath;
type TrimSplatRoute<TPath extends string> = TPath extends `${infer TPrefix}/$` ? TPrefix : TPath;
type PathParamName<TName extends string> = TName extends "" ? "_splat" : TName;
type PathParamNames<TPath extends string> = TPath extends `${string}$${infer TName}/${infer TRest}`
  ? PathParamName<TName> | PathParamNames<`/${TRest}`>
  : TPath extends `${string}$${infer TName}`
    ? PathParamName<TName>
    : never;

type ParamsOption<TTo extends AppRouteTo> = [PathParamNames<TTo>] extends [never]
  ? { params?: never }
  : { params: Record<PathParamNames<TTo>, PathParamValue> };

type SearchOption = { search?: Record<string, unknown> };

type TanStackStartPathOptions<TTo extends AppRouteTo> = { to: TTo } & ParamsOption<TTo> &
  SearchOption & {
    hash?: string;
  };

/**
 * TanStack's own `interpolatePath` only accepts route segments pre-parsed from a
 * live router instance, which a bare path literal does not have. The literals
 * reaching `$appPath` are constrained by `PathParamNames` to whole-segment
 * `$name` params and a trailing `$` splat, so interpolation is a split/map.
 */
function interpolate(to: string, params: Record<string, unknown>): string {
  return to
    .split("/")
    .map((segment) => {
      if (!segment.startsWith("$")) {
        return segment;
      }

      const name = segment === "$" ? "_splat" : segment.slice(1);
      const value = params[name];

      if (value == null || value === "") {
        throw new Error(`Missing param "${name}" for TanStack Start route: ${to}`);
      }

      // A splat stands for several segments, so its slashes must survive encoding.
      return name === "_splat"
        ? String(value).split("/").map(encodeURIComponent).join("/")
        : encodeURIComponent(String(value));
    })
    .join("/");
}

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
