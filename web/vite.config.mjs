import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
// ATLAN PATCH: Support sub-path deployment via VITE_BASE_PATH build-time env var.
// Set VITE_BASE_PATH=/api/capacitor/ when building the Docker image.
// Kong strip-path:true handles stripping the prefix before forwarding to the Go server.
export default defineConfig({
  build: {
    outDir: 'build',
  },
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), eslint()],
  server: {
    open: true,
    port: 3000,
    proxy: {
      '/health': 'http://localhost:9000',
      '/api': 'http://localhost:9000',
      // WebSocket proxy: log streaming uses ws://localhost:3000/ws/ in dev,
      // which must be forwarded to the Go server's /ws/ WebSocket handler.
      '/ws': {
        target: 'ws://localhost:9000',
        ws: true,
      },
    },
  },
})
