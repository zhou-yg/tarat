import { defineConfig } from 'vite'
const config = defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    server: {
      open: 'http://localhost:9002/index.html',
      port: 9002,
    },
    resolve: {
      alias: {
        'tarat-core': 'tarat-core/dist/index.client.js'
      }
    }
  }
})

export default config
