import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Тъй като config-а е в папка client, src е точно до него
      "@": path.resolve(__dirname, "src"),
      // shared е едно ниво нагоре (извън папка client)
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  
  // ВАЖНО: Махнахме "root", защото файлът вече си е на правилното място
  
  build: {
    // Изкарваме билда в папка dist (едно ниво нагоре)
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
  },
  
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
