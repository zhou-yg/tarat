import { defineConfig } from 'vite'
const config = defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    esbuild: {
      jsxFactory: 'createElement',
      jsxFragment: 'Fragment'
    },
    server: {
      open: 'http://localhost:9002/index.html',
      port: 9002,
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true 
        }
      }
    },
    optimizeDeps: {
      exclude: ['axii']
    }
  }
})

export default config
