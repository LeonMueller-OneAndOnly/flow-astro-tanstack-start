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
  appName: "Omnis Start",
  basePath: authBasePath,
  baseURL: APP_ORIGIN,
  secret: SESSION_SECRET_KEY,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      ...schema,
      user: schema.authUsers,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
    },
  }),
  user: {
    modelName: "auth_users",
  },
  session: {
    modelName: "auth_sessions",
  },
  account: {
    modelName: "auth_accounts",
  },
  verification: {
    modelName: "auth_verifications",
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
      subject: "Sign in to Omnis Start",
      text: `Open this link to sign in: ${input.url}`,
      html: `<p>Open this link to sign in:</p><p><a href="${input.url}">${input.url}</a></p>`,
    },
    reason: "better-auth-magic-link",
  });
}
