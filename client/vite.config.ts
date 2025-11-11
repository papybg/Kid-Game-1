import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Vercel ще търси 'dist' вътре в 'client/'
    outDir: 'dist', 
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // Това казва на Vercel, че '@' означава './src'
      '@': path.resolve(__dirname, './src'), 
    },
  },
})
