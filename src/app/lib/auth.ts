import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { magicLink, username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { sendMail } from "../../integrations/mailer";
import { db } from "../../db/client";
import * as schema from "../../db/schema";
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
      sendMagicLink: async ({ email, url }) => {
        await sendMail(
          {
            to: email,
            subject: "Sign in to Astro TanStack Start",
            text: `Open this link to sign in: ${url}`,
            html: `<p>Open this link to sign in:</p><p><a href="${url}">${url}</a></p>`,
          },
          "better-auth-magic-link",
        );
      },
    }),
    tanstackStartCookies(),
  ],
});
