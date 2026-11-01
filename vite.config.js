import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { standaloneApi } from './dev/mockApi.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    proxy: mode === 'standalone' ? undefined : { '/api': { target: loadEnv(mode, process.cwd(), '').API_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true } },
  },
  plugins: [
    ...(mode === 'standalone' ? [standaloneApi()] : []),
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
