import { describe, expect, it, vi } from "vitest";
import type { Plugin, Rollup } from "vite";

import { composeAstroTanStackBuild } from "./compose-astro-tanstack-build";

const clientEntry = "/workspace/src/app/client.tsx";

describe("composeAstroTanStackBuild", () => {
  it("captures only the bundle containing the TanStack client entry", () => {
    const capture = vi.fn<() => void>();
    const manifestPlugin: Plugin = {
      name: "tanstack-start:start-manifest-capture-client-build",
      generateBundle: capture,
    };

    composeAstroTanStackBuild({ tanstackPlugins: [manifestPlugin], clientEntry });
    const generateBundle = manifestPlugin.generateBundle;
    expect(typeof generateBundle).toBe("function");

    if (typeof generateBundle !== "function") return;

    generateBundle.call(
      {} as never,
      {} as never,
      bundle("index", "/workspace/src/index.tsx"),
      true,
    );
    expect(capture).not.toHaveBeenCalled();

    generateBundle.call({} as never, {} as never, bundle("app", clientEntry), true);
    expect(capture).toHaveBeenCalledOnce();
  });
});

function bundle(name: string, facadeModuleId: string): Rollup.OutputBundle {
  return {
    [`${name}.js`]: {
      type: "chunk",
      fileName: `${name}.js`,
      name,
      isEntry: true,
      facadeModuleId,
      moduleIds: [facadeModuleId],
    } as Rollup.OutputChunk,
  };
}
