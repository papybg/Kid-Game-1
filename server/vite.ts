import { type Express, Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import path from "path";
import { createServer as createViteServer } from "vite";
import { type Server } from "http";
import { getDirname } from "./utils";

const __dirname = getDirname(import.meta.url);
const clientRoot = path.resolve(__dirname, "..", "client");

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", { /* ... */ });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    // root казва на Vite къде е frontend проекта.
    root: clientRoot, 
    server: { 
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  // Middleware-ът на Vite се грижи за JS/CSS/HMR.
  app.use(vite.middlewares);

  // Универсален handler, който сервира index.html за SPA рутиране.
  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    try {
      // Пътят до index.html вече е ясен, защото използваме clientRoot.
      const templatePath = path.resolve(clientRoot, "index.html");
      const template = await fs.readFile(templatePath, "utf-8");
      
      const html = await vite.transformIndexHtml(url, template);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  log("Vite middleware setup complete. Ready for development!");
}

// Production функцията не я пипаме, тя е добре.
export function serveStatic(app: Express) {
    const distPath = path.resolve(clientRoot, "dist");

    if (!fs.existsSync(distPath)) {
        console.warn(`Warning: no client build found at ${distPath}. Starting API only.`);
        return;
    }

    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            return next();
        }
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}