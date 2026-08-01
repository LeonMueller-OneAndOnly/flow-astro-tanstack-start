export {};

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

/**
 * Types the `?responsive` image imports that `@responsive-image/vite-plugin` handles
 */
/// <reference types="@responsive-image/vite-plugin/client" />
