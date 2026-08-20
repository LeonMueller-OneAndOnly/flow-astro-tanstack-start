// Imported by scripts/log-database-url.ts, which plain Node runs with type
// stripping only, so this module must stay free of imports and Vite-only
// features.

const redactionMarker = "***";

export const defaultDatabaseUrl = "file:./data/db.sqlite3";

/**
 * Removes credentials from a database URL so it can be logged.
 *
 * Kept on strings instead of `new URL`: `file:./data/db.sqlite3` parses to
 * `file:///data/db.sqlite3`, which points at a different file than the one the
 * process actually opens — a log line that lies is worse than none.
 */
export function redactDatabaseUrl(databaseUrl: string): string {
  const queryStart = databaseUrl.indexOf("?");

  if (queryStart === -1) return redactUserInfo(databaseUrl);

  const location = redactUserInfo(databaseUrl.slice(0, queryStart));
  const query = redactQuery(databaseUrl.slice(queryStart + 1));

  return `${location}?${query}`;
}

/** `scheme://user:password@host/path` keeps the user, drops the password. */
function redactUserInfo(location: string): string {
  const authorityStart = location.indexOf("://");

  if (authorityStart === -1) return location;

  const authorityEnd = location.indexOf("/", authorityStart + 3);
  const authority = location.slice(
    authorityStart + 3,
    authorityEnd === -1 ? undefined : authorityEnd,
  );
  const userInfoEnd = authority.lastIndexOf("@");

  if (userInfoEnd === -1) return location;

  const passwordStart = authority.slice(0, userInfoEnd).indexOf(":");

  if (passwordStart === -1) return location;

  return (
    location.slice(0, authorityStart + 3 + passwordStart + 1) +
    redactionMarker +
    location.slice(authorityStart + 3 + userInfoEnd)
  );
}

/**
 * Every parameter value is dropped, not just the ones that look like a secret:
 * `authToken` is only the name libSQL happens to use, and guessing which of the
 * remaining names carries a credential is exactly the check that leaks the one
 * that was not on the list. Names are kept, they identify the connection.
 */
function redactQuery(query: string): string {
  return query
    .split("&")
    .map((parameter) => {
      const valueStart = parameter.indexOf("=");

      if (valueStart === -1) return parameter;

      return `${parameter.slice(0, valueStart)}=${redactionMarker}`;
    })
    .join("&");
}
