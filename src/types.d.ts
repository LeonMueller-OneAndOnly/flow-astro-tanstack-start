/**
 * Types the `?responsive` image imports that `@responsive-image/vite-plugin` handles.
 *
 * Has to stay at the very top: a triple-slash directive is only honoured before the
 * first statement in a file, and is silently ignored anywhere else. Move it down and
 * every `…jpg?…&responsive` import fails to resolve, with the error pointing at the
 * import rather than at here.
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
