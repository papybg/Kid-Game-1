import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getDirname } from "./utils";

// Load environment variables
config();

const __dirname = getDirname(import.meta.url);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS настройки
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || 
        origin.includes('.vercel.app') || 
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('kidgame1backend.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

app.options('*', cors());

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

// Основен блок за стартиране на приложението
(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("❌ An error occurred:", err.stack);
    res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || '3005', 10);

  if (process.env.NODE_ENV === "development") {
    // В DEVELOPMENT режим, setupVite се грижи за всичко, включително стартирането.
    log("Starting in development mode...");
    await setupVite(app, server);
  } else {
    // В PRODUCTION режим, ние стартираме сървъра ръчно.
    log("Starting in production mode...");
    try {
      serveStatic(app);
    } catch (err) {
      console.warn(
        "Warning: serveStatic failed — starting API without client static files.",
        err instanceof Error ? err.message : err,
      );
    }
    server.listen(port, () => {
      log(`✅ [express] Server is running and successfully listening on port ${port}`);
    });
  }
})();