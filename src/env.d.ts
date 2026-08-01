/**
 * Types the `?responsive` image imports that `@responsive-image/vite-plugin` handles,
 * so `import hero from "./hero.jpg?responsive"` resolves to `ImageData` instead of not
 * resolving at all. The query has to be the *last* one in a specifier: the plugin
 * declares `*?responsive` and `*&responsive` as module patterns, and TypeScript allows
 * a single wildcard per pattern, so it cannot match a query in the middle.
 *
 * Referenced here rather than through `compilerOptions.types` in `tsconfig.json`,
 * because setting that field switches off the automatic inclusion of every other
 * `@types/*` package and would take `@types/node` down with it.
 */
/// <reference types="@responsive-image/vite-plugin/client" />

type AstroServerEnv = {
  -readonly [Key in keyof typeof import("astro:env/server")]: (typeof import("astro:env/server"))[Key];
};

declare global {
  interface ImportMeta {
    readonly hot?: {
      dispose(callback: () => void): void;
    };
  }

  namespace NodeJS {
    interface ProcessEnv extends AstroServerEnv {}
  }
}

export {};
