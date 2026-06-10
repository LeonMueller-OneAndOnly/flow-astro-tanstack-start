import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = site ? new URL("sitemap-index.xml", site).href : "/sitemap-index.xml";

  return new Response(["User-agent: *", "Disallow:", `Sitemap: ${sitemapUrl}`, ""].join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
