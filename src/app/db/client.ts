import { createClient } from "@libsql/client/node";
import { DATABASE_URL } from "astro:env/server";
import { drizzle } from "drizzle-orm/libsql/node";

import * as schema from "./schema";

export const libsql = createClient({
  url: DATABASE_URL,
});

export const db = drizzle(libsql, { schema });
