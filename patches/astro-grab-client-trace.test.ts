import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Guards `astro-grab@0.3.0.patch`, which adds the `{{trace}}` placeholder to the
 * grab client. The patch has to be re-ported on every astro-grab upgrade, so the
 * behaviour is pinned here rather than only in the diff.
 *
 * The trace builder is not exported from the package, so it is lifted out of the
 * shipped bundle by source markers — if the patch is lost, the markers are gone
 * and this file fails loudly instead of silently testing nothing.
 */
const bundle = readFileSync("node_modules/astro-grab/dist/client/index.js", "utf-8");

const liftFromBundle = <T,>(startMarker: string, endMarker: string, returned: string): T => {
  const start = bundle.indexOf(startMarker);
  const end = bundle.indexOf(endMarker);
  expect(start, `astro-grab patch is missing "${startMarker}"`).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);

  return new Function(`${bundle.slice(start, end)}; return ${returned};`)() as T;
};

interface TraceNode {
  getAttribute: (name: string) => string | null;
  parentElement: TraceNode | null;
}

/** Builds a DOM-like ancestor chain from outermost to innermost, returning the click target. */
const chain = (...encodedFromOutside: (string | null)[]): TraceNode => {
  let parent: TraceNode | null = null;
  for (const encoded of encodedFromOutside) {
    parent = {
      getAttribute: (name) => (name === "data-astro-grab" ? encoded : null),
      parentElement: parent,
    };
  }
  if (!parent) throw new Error("chain needs at least one element");
  return parent;
};

describe("astro-grab component trace", () => {
  const buildComponentTrace = liftFromBundle<(element: TraceNode) => string>(
    "var DEFAULT_TRACE_LIMIT",
    "// src/client/clipboard.ts",
    "buildComponentTrace",
  );

  it("collapses a run of elements from one file to the targeted element", () => {
    const target = chain(
      "src/layouts/BaseLayout.astro:78:1",
      "src/pages/index.astro:56:3",
      "src/components/TitleBanner.astro:8:1",
      "src/components/TitleBanner.astro:9:3",
    );

    expect(buildComponentTrace(target)).toBe(
      "src/components/TitleBanner.astro:9 → src/pages/index.astro:56 → src/layouts/BaseLayout.astro:78",
    );
  });

  it("caps the chain at four entries", () => {
    const target = chain("e.astro:5:1", "d.astro:4:1", "c.astro:3:1", "b.astro:2:1", "a.astro:1:1");

    expect(buildComponentTrace(target)).toBe(
      "a.astro:1 → b.astro:2 → c.astro:3 → d.astro:4",
    );
  });

  it("keeps a file that reappears further up, as slotted content does", () => {
    const target = chain(
      "src/pages/index.astro:56:3",
      "src/components/TitleBanner.astro:8:1",
      "src/pages/index.astro:60:5",
    );

    expect(buildComponentTrace(target)).toBe(
      "src/pages/index.astro:60 → src/components/TitleBanner.astro:8 → src/pages/index.astro:56",
    );
  });

  it("skips ancestors without source attribution, such as framework islands", () => {
    const target = chain(
      "src/pages/index.astro:56:3",
      "src/components/TitleBanner.astro:9:3",
      null,
      null,
    );

    expect(buildComponentTrace(target)).toBe(
      "src/components/TitleBanner.astro:9 → src/pages/index.astro:56",
    );
  });

  it("splits off line and column when the path itself contains a colon", () => {
    expect(buildComponentTrace(chain("C:/site/src/pages/index.astro:56:3"))).toBe(
      "C:/site/src/pages/index.astro:56",
    );
  });

  // The trace already opens with the targeted element, so a separate
  // `{{file}}:{{targetLine}}` header would repeat it verbatim.
  it("carries the trace in the default template instead of a second source line", () => {
    const defaultTemplate = liftFromBundle<string>(
      "var DEFAULT_TEMPLATE",
      "var copyToClipboard",
      "DEFAULT_TEMPLATE",
    );

    expect(defaultTemplate.startsWith("Source: {{trace}}\n")).toBe(true);
    expect(defaultTemplate).not.toContain("{{targetLine}}");
  });
});
