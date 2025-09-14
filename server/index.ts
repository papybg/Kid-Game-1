import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getDirname } from "./utils";

const __dirname = getDirname(import.meta.url);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurable CORS allowlist. Set ALLOWED_ORIGINS as a comma-separated list or '*' to allow all.
// Example: ALLOWED_ORIGINS="https://your-netlify-site.netlify.app,https://example.com"
app.use((req, res, next) => {
  const allowedRaw = process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173';
  const allowed = allowedRaw.split(',').map(s => s.trim()).filter(Boolean);
  const origin = (req.headers.origin || '').toString();

  // If allowlist contains '*' then allow everything.
  const allowAll = allowed.includes('*');
  const isAllowed = allowAll || allowed.includes(origin) || (!origin && allowed.includes('http://localhost:5173'));

  if (isAllowed) {
    // If allowAll is true we must not send Access-Control-Allow-Credentials: true with a wildcard origin
    // Browsers reject wildcard origin when credentials are included. If allowAll is set, send '*' as origin
    // but don't set credentials header. If origin is specific, echo it and allow credentials.
    res.header('Access-Control-Allow-Origin', origin || (allowAll ? '*' : allowed[0] || '*'));
    if (!allowAll && origin) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3001', 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
