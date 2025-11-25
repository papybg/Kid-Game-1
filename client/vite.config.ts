import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  
  build: {
    // ВРЪЩАМЕ ГО СТАНДАРТНО: Просто "dist" в текущата папка
    outDir: "dist",
    emptyOutDir: true,
  },
  
  // Запазваме проксито за да работи звука докато разработваш (npm run dev)
  server: {
    host: "0.0.0.0",
    proxy: {
      '/game-audio': {
        target: 'https://res.cloudinary.com/db8o7so6j/video/upload',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/game-audio/, ''),
        secure: false,
      },
      '/game-images': {
        target: 'https://res.cloudinary.com/db8o7so6j/image/upload',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/game-images/, ''),
        secure: false,
      }
    }
  }
});
