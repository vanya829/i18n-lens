import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Adds a shebang line to the CLI entry chunk so it is executable
 * directly as a Node.js script via `#!/usr/bin/env node`.
 */
function addShebang(): Plugin {
  return {
    name: 'add-shebang',
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (
          chunk.type === 'chunk' &&
          chunk.facadeModuleId?.endsWith('cli.ts')
        ) {
          chunk.code = `#!/usr/bin/env node\n${chunk.code}`
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    dts({
      include: [
        'src/index.ts',
        'src/types.ts',
        'src/sorter.ts',
        'src/comparator.ts',
        'src/duplicateFinder.ts',
        'src/fileUtils.ts',
      ],
      rollupTypes: true,
    }),
    addShebang(),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/cli.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        /^node:/,
        'commander',
        'chalk',
        'fast-glob',
      ],
    },
  },
})
