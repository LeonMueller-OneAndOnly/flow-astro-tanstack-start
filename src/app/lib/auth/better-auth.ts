import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { magicLink, username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { sendMail } from "../../../integrations/mailer";
import { db } from "../../../db/client";
import * as schema from "../../../db/schema";
import { authBasePath } from "./auth-config";

export const auth = betterAuth({
  appName: "Astro TanStack Start",
  basePath: authBasePath,
  baseURL: process.env.APP_ORIGIN,
  secret: process.env.SESSION_SECRET_KEY,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
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
      subject: "Sign in to Astro TanStack Start",
      text: `Open this link to sign in: ${input.url}`,
      html: `<p>Open this link to sign in:</p><p><a href="${input.url}">${input.url}</a></p>`,
    },
    reason: "better-auth-magic-link",
  });
}
