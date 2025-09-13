import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes.js";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const port = parseInt(process.env.PORT || "3001", 10);

async function createDevServer() {
  const viteServer = await createViteServer({
    root: path.resolve(__dirname, "../client"),
    server: { middlewareMode: true },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../client/src'),
        '@shared': path.resolve(__dirname, '../shared')
      }
    }
  });

  app.use(viteServer.middlewares);

  return createServer(app);
}

async function createProdServer() {
  const distPath = path.resolve(__dirname, "../client/dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  return createServer(app);
}

async function start() {
  // Register API routes first
  await registerRoutes(app);

  // Then set up static/dev server
  const server = isProd ? await createProdServer() : await createDevServer();

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

start().catch(console.error);