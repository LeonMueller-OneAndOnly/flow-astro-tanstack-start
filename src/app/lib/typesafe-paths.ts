import { defaultStringifySearch, interpolatePath } from "@tanstack/react-router";
import type { FileRoutesByPath } from "@tanstack/react-router";

/**
 * Builds a URL string for a file-based route, type-checked against the generated
 * route tree. Use `Link`/`useNavigate` for in-app navigation; this is for the
 * places that need a plain string — `fetch` targets, Better Auth's `basePath`,
 * and URLs embedded in API responses.
 *
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

  const search = toSearch("search" in options ? options.search : undefined);
  const hash = toHash(options.hash);

  return `${interpolatedPath}${search}${hash}`;
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
