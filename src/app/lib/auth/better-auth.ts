import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { APP_ORIGIN, SESSION_SECRET_KEY } from "astro:env/server";
import { betterAuth } from "better-auth";
import { magicLink, username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { sendMail } from "../../../integrations/mailer";
import { db } from "../../../db/client";
import * as schema from "../../../db/schema";
import { authBasePath } from "./auth-config";

export const auth = betterAuth({
  appName: "Omvin Start",
  basePath: authBasePath,
  baseURL: APP_ORIGIN,
  secret: SESSION_SECRET_KEY,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  // The drizzle adapter looks tables up by their key in `schema`, so modelName is the
  // export name, not the SQL table name (that comes from `sqliteTable("auth_users")`).
  // Since 1.7 a mismatch fails Better Auth's startup schema check.
  user: {
    modelName: "authUsers",
  },
  session: {
    modelName: "authSessions",
  },
  account: {
    modelName: "authAccounts",
  },
  verification: {
    modelName: "authVerifications",
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    magicLink({
      sendMagicLink: sendMagicLink,
      expiresIn: 30 * 60, // seconds
    }),
    tanstackStartCookies(),
  ],
});

async function sendMagicLink(input: { email: string; url: string }) {
  await sendMail({
    mail: {
      to: input.email,
      subject: "Sign in to Omvin Start",
      text: `Open this link to sign in: ${input.url}`,
      html: `<p>Open this link to sign in:</p><p><a href="${input.url}">${input.url}</a></p>`,
    },
    reason: "better-auth-magic-link",
  });
}
