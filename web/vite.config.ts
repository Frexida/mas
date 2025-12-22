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
      minify: 'terser',
      // Ensure CSS is processed consistently
      cssMinify: true,
      // Preserve all CSS for consistency
      cssCodeSplit: false
    },
    css: {
      postcss: './postcss.config.js'
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_PORT || '5173'),
      strictPort: true,
      cors: true,
      // HMR configuration can be customized via environment variables
      hmr: env.VITE_HMR_HOST ? {
        host: env.VITE_HMR_HOST,
        port: parseInt(env.VITE_HMR_PORT || '5173')
      } : true,
      // Proxy configuration (optional, configured via environment)
      // Supports both VITE_API_PROXY_TARGET and VITE_API_BASE
      proxy: (env.VITE_API_PROXY_TARGET || env.VITE_API_BASE) ? {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || env.VITE_API_BASE,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false
        }
      } : undefined
    }
  }
})
