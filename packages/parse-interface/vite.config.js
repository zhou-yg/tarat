import { defineConfig } from 'vite'

/**
 * @type {import('vite').UserConfig}
 */
const config = defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    esbuild: {
      jsxFactory: 'createElement',
      jsxFragment: 'Fragment'
    },
    server: {
      open: 'http://localhost:3001/examples/index.html',
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true 
        }
      }
    },
    build: {
      minify: !isDev,
      watch: isDev,
      sourcemap: isDev,
      lib: {
        entry : './src/index.js',
        name: 'parse-interfaces'
      },
      rollupOptions: {
        external: 'typescript',
        output: {
          globals: {
            'typescript': 'typescript',
          }
        }
      }
    }
  }
})

export default config
