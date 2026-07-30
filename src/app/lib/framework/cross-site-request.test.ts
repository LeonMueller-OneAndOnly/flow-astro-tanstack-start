import { describe, expect, it } from "vitest";

import { isCrossSiteRequest } from "./cross-site-request";

const appOrigin = "https://app.example.com";

function request(init: {
  method?: string;
  origin?: string;
  fetchSite?: string;
  contentType?: string;
}): Request {
  const headers = new Headers();
  if (init.origin) headers.set("origin", init.origin);
  if (init.fetchSite) headers.set("sec-fetch-site", init.fetchSite);
  if (init.contentType) headers.set("content-type", init.contentType);

  return new Request("https://app.example.com/some-route", {
    method: init.method ?? "POST",
    headers,
  });
}

describe("isCrossSiteRequest", () => {
  it("allows safe methods whatever the origin", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      const preflight = request({
        method,
        fetchSite: "cross-site",
        origin: "https://evil.example",
      });

      expect(isCrossSiteRequest(preflight, appOrigin)).toBe(false);
    }
  });

  describe("modern browsers, which send Sec-Fetch-Site", () => {
    it("allows same-origin requests", () => {
      expect(isCrossSiteRequest(request({ fetchSite: "same-origin" }), appOrigin)).toBe(false);
    });

    it("blocks cross-site and same-site requests regardless of content type", () => {
      for (const fetchSite of ["cross-site", "same-site", "none"]) {
        for (const contentType of ["application/json", "application/x-www-form-urlencoded"]) {
          expect(isCrossSiteRequest(request({ fetchSite, contentType }), appOrigin)).toBe(true);
        }
      }
    });

    it("trusts Sec-Fetch-Site over a forged Origin", () => {
      const forged = request({ fetchSite: "cross-site", origin: appOrigin });

      expect(isCrossSiteRequest(forged, appOrigin)).toBe(true);
    });
  });

  describe("older browsers, which send Origin only", () => {
    it("allows a matching origin", () => {
      expect(isCrossSiteRequest(request({ origin: appOrigin }), appOrigin)).toBe(false);
    });

    it("blocks a foreign origin", () => {
      expect(isCrossSiteRequest(request({ origin: "https://evil.example" }), appOrigin)).toBe(true);
    });
  });

  describe("non-browser callers, which send neither header", () => {
    it("allows webhooks and server-to-server requests", () => {
      const webhook = request({ contentType: "application/json" });

      expect(isCrossSiteRequest(webhook, appOrigin)).toBe(false);
    });

    it("allows the instrumentation call, which sends no body at all", () => {
      expect(isCrossSiteRequest(request({}), appOrigin)).toBe(false);
    });
  });
});
