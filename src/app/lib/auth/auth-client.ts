import { createAuthClient } from "better-auth/react";
import { magicLinkClient, usernameClient } from "better-auth/client/plugins";

import { authBasePath } from "./auth-config";

export const authClient = createAuthClient({
  basePath: authBasePath,
  plugins: [usernameClient(), magicLinkClient()],
});
