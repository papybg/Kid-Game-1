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

// CORS настройки - разреши всички Vercel домейни и localhost
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

// Добави OPTIONS handler за preflight requests
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

// --- ВРЕМЕНЕН БЛОК САМО ЗА ТЕСТ ---
(async () => {
  console.log("--- Starting BARE BONES server test ---");

  // Предполагаме, че registerRoutes връща http.Server инстанция
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("❌ An error occurred:", err.stack);
    res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || '3005', 10);

  // Игнорираме Vite и статичните файлове. Опитваме се да стартираме само API сървъра.
  server.listen(port, () => {
    console.log(`✅ [express] BARE BONES server is listening on port ${port}`);
    console.log(`🚀 Now, try to open http://localhost:${port}/api/game-session/d1 in your browser.`);
  });

  server.on('error', (error) => {
    console.error('❌ [express] BARE BONES server failed to start with an error:', error);
  });

})();
// --- КРАЙ НА ВРЕМЕННИЯ КОД ---