// Брой редове: 39
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ПРЕМАХНАХМЕ импортите на @replit, защото чупят Vercel

export default defineConfig({
  // Изчистен списък с плъгини (само React)
  plugins: [react()],
  
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
  
  // Запазваме проксито за локална разработка (за да се чува Бобо)
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
