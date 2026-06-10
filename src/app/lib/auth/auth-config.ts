import { $appPath } from "../typesafe-paths";

export const authBasePath = $appPath({ to: "/api/auth/$", params: { _splat: "" } }).replace(
  /\/$/,
  "",
);
