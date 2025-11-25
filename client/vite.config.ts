// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  // --- ДОБАВИ ТАЗИ СЕКЦИЯ server ---
  server: {
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
  // --------------------------------
});
