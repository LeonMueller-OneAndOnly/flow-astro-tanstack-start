import { createServer } from "node:http";
import { getDefaultResultOrder } from "node:dns";

import { afterEach, describe, expect, it, vi } from "vitest";

import { instrument } from "./instrument";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("instrument", () => {
  it("prefers IPv4 while retaining localhost", () => {
    expect(getDefaultResultOrder()).toBe("ipv4first");
  });

  it.each(["localhost", "0.0.0.0", "::", ""])(
    "uses localhost for the %s server address",
    async (host) => {
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 204 }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await instrument(host, 4321);

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:4321/instrumentation", {
        method: "POST",
      });
    },
  );

  it("binds localhost on IPv4 for the readiness path", async () => {
    const server = createServer();

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "localhost", resolve);
    });

    const address = server.address();
    const family = address !== null && typeof address !== "string" ? address.family : undefined;

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    expect(family).toBe("IPv4");
  });
});
