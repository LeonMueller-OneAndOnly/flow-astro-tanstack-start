import { describe, expect, it } from "vitest";

import { isCrossSiteFormRequest } from "./cross-site-request";

const appOrigin = "https://app.example.com";

function request(init: { method?: string; origin?: string; contentType?: string }): Request {
  const headers = new Headers();
  if (init.origin) headers.set("origin", init.origin);
  if (init.contentType) headers.set("content-type", init.contentType);

  return new Request("https://app.example.com/some-route", {
    method: init.method ?? "POST",
    headers,
  });
}

describe("isCrossSiteFormRequest", () => {
  it("allows safe methods regardless of origin", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      expect(
        isCrossSiteFormRequest(request({ method, origin: "https://evil.example" }), appOrigin),
      ).toBe(false);
    }
  });

  it("allows same-origin form posts", () => {
    const sameOrigin = request({
      origin: appOrigin,
      contentType: "application/x-www-form-urlencoded",
    });

    expect(isCrossSiteFormRequest(sameOrigin, appOrigin)).toBe(false);
  });

  it("blocks cross-origin form posts", () => {
    for (const contentType of [
      "application/x-www-form-urlencoded",
      "multipart/form-data; boundary=----abc",
      "text/plain;charset=UTF-8",
      "MULTIPART/FORM-DATA",
    ]) {
      expect(
        isCrossSiteFormRequest(request({ origin: "https://evil.example", contentType }), appOrigin),
      ).toBe(true);
    }
  });

  it("blocks unsafe requests that omit the content type", () => {
    expect(isCrossSiteFormRequest(request({ origin: "https://evil.example" }), appOrigin)).toBe(
      true,
    );
    expect(isCrossSiteFormRequest(request({}), appOrigin)).toBe(true);
  });

  it("allows preflight-protected content types without an origin, so webhooks reach us", () => {
    const webhook = request({ contentType: "application/json" });

    expect(isCrossSiteFormRequest(webhook, appOrigin)).toBe(false);
  });

  it("allows cross-origin json, which a browser cannot send without a preflight", () => {
    const jsonPost = request({ origin: "https://evil.example", contentType: "application/json" });

    expect(isCrossSiteFormRequest(jsonPost, appOrigin)).toBe(false);
  });
});
