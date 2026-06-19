import type { Plugin, PluginOption, UserConfig, ViteBuilder } from "vite";

type BuilderOptions = NonNullable<UserConfig["builder"]>;
type BuildApp = NonNullable<BuilderOptions["buildApp"]>;

export function composeAstroTanStackBuild(tanstackPlugins: PluginOption): Array<PluginOption> {
  let astroBuilder: BuilderOptions | undefined;

  return [
    {
      name: "compose-astro-tanstack-build:capture-astro",
      enforce: "pre",
      config(config) {
        astroBuilder = config.builder;
      },
    } satisfies Plugin,
    tanstackPlugins,
    {
      name: "compose-astro-tanstack-build:compose",
      enforce: "post",
      config(config) {
        const tanstackBuilder = config.builder;
        const astroBuildApp: BuildApp | undefined = astroBuilder?.buildApp;
        const tanstackBuildApp: BuildApp | undefined = tanstackBuilder?.buildApp;

        if (!astroBuildApp || !tanstackBuildApp || astroBuilder === tanstackBuilder) {
          return;
        }

        return {
          builder: {
            ...tanstackBuilder,
            async buildApp(builder: ViteBuilder) {
              const clientEnvironment = builder.environments.client;
              if (clientEnvironment && !clientEnvironment.isBuilt) {
                await builder.build(clientEnvironment);
              }

              await astroBuildApp(builder);
              await tanstackBuildApp(builder);
            },
          },
        };
      },
    } satisfies Plugin,
  ];
}
