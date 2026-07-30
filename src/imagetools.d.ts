// vite-imagetools 10 ships no client types, so the query-suffix imports it
// handles are declared here. One declaration per output format we use; the
// wildcard matches the asset path plus any preceding transform parameters.

declare module "*&as=img" {
  /** `srcset` is only present when the import requested more than one width. */
  const output: { src: string; w: number; h: number; srcset?: string };
  export default output;
}

declare module "*&as=srcset" {
  const srcset: string;
  export default srcset;
}

declare module "*&as=metadata" {
  const metadata: { src: string; width: number; height: number; format: string };
  export default metadata;
}
