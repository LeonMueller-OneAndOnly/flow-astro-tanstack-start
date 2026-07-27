import type { Plugin, PluginOption, UserConfig, ViteBuilder } from "vite";

type BuilderOptions = NonNullable<UserConfig["builder"]>;
type BuildApp = NonNullable<BuilderOptions["buildApp"]>;

export function composeAstroTanStackBuild(tanstackPlugins: PluginOption): Array<PluginOption> {
  let astroBuilder: BuilderOptions | undefined;
  const pluginStack = [tanstackPlugins];
  let manifestCapturePlugin: Plugin | undefined;

  while (pluginStack.length > 0) {
    const plugin = pluginStack.pop();
    if (Array.isArray(plugin)) {
      pluginStack.push(...plugin);
    } else if (
      plugin &&
      typeof plugin === "object" &&
      "name" in plugin &&
      plugin.name === "tanstack-start:start-manifest-capture-client-build"
    ) {
      manifestCapturePlugin = plugin;
      break;
    }
  }

  if (!manifestCapturePlugin?.generateBundle) {
    throw new Error("TanStack Start manifest capture plugin was not found");
  }

  const generateBundleHook = manifestCapturePlugin.generateBundle;
  const generateBundleHandler =
    typeof generateBundleHook === "function" ? generateBundleHook : generateBundleHook.handler;
  const guardedGenerateBundle: typeof generateBundleHandler = function (options, bundle, isWrite) {
    const isTanStackClientBuild = Object.values(bundle).some(
      (entry) => entry.type === "chunk" && entry.isEntry && entry.name === "index",
    );

    if (!isTanStackClientBuild) return;
    return generateBundleHandler.call(this, options, bundle, isWrite);
  };

  manifestCapturePlugin.generateBundle =
    typeof generateBundleHook === "function"
      ? guardedGenerateBundle
      : { ...generateBundleHook, handler: guardedGenerateBundle };

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
