type AstroServerEnv = {
  -readonly [Key in keyof typeof import("astro:env/server")]: (typeof import("astro:env/server"))[Key];
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends AstroServerEnv {}
  }
}

export {};
