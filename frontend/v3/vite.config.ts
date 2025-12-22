import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser'
    },
    server: {
      host: '0.0.0.0',
      port: 5175,
      strictPort: true,
      cors: true,
      // HMR configuration can be customized via environment variables
      hmr: env.VITE_HMR_HOST ? {
        host: env.VITE_HMR_HOST,
        port: parseInt(env.VITE_HMR_PORT || '5173')
      } : true,
      // Proxy configuration (optional, configured via environment)
      proxy: env.VITE_API_PROXY_TARGET ? {
        '/api': {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false
        }
      } : undefined
    }
  }
})
