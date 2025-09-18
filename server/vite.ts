import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { getDirname } from "./utils";

const __dirname = getDirname(import.meta.url);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Try several likely locations for the client build. Render and local builds
  // may place the files in slightly different paths, so accept the first
  // one that exists.
  const candidates = [
    path.resolve(process.cwd(), "dist", "public"), // explicit project-root dist/public
    path.resolve(__dirname, "..", "dist", "public"), // relative to server dir
    path.resolve(__dirname, "public"), // default when building to dist/public
    path.resolve(__dirname, "..", "client", "dist"), // client/dist
    path.resolve(process.cwd(), "client", "dist"), // alternate client/dist
  ];

  const distPath = candidates.find((p) => fs.existsSync(p));

  if (!distPath) {
    // If no client build is present, log a warning and continue running the API only.
    // This prevents a hard crash on Render so that API endpoints remain available.
    console.warn(
      `Warning: no client build found. Checked: ${candidates.join(", ")}. Starting API only.`,
    );
    return;
  }

  console.log(`Serving static files from: ${distPath}`);

  // Serve static files with higher priority
  app.use(express.static(distPath, {
    index: false, // Don't serve index.html for root requests
    extensions: ['html', 'htm'] // Only serve these extensions for directory requests
  }));

  // Specific handling for images to ensure they're served correctly
  app.use('/images', express.static(path.join(distPath, 'images'), {
    maxAge: '1d' // Cache images for 1 day
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res, next) => {
    // Skip API routes - let them be handled by registered routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    const filePath = path.resolve(distPath, req.path.substring(1));
    
    // Check if the requested file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      // If it's a file, serve it
      res.sendFile(filePath);
    } else {
      // Otherwise serve index.html for SPA routing
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
