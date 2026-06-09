// @ts-check
import { defineConfig } from 'astro/config'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  vite: {
    plugins: [
      tanstackStart({
        srcDirectory: './src/app',
        router: {
          basepath: 'app',
        },
      }),
      viteTsConfigPaths(),
      tailwindcss(),
    ] as any,
  },

  integrations: [react()],
})