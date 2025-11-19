import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tsconfigPaths from 'vite-tsconfig-paths'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.PORT = '3005';

// https://vitejs.dev/config/
export default defineConfig({
  root: './client',
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: '../dist/public'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, 'shared')
    }
  },
  server: {
    host: true,
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 8080,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT || 3005}`,
        changeOrigin: true
      }
    }
  }
})