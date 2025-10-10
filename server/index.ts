import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "dotenv";
import { setupRoutes } from "./routes";
import adminRoutes from "./adminRoutes";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Build allowed origins list from env plus sensible defaults for dev
const defaultOrigins = ['https://bgm-design.com', 'https://kid-game-1.vercel.app'];
const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) : [];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

// Always allow localhost for local development (Vite client)
if ((process.env.NODE_ENV || 'development') !== 'production') {
  allowedOrigins.push('http://localhost:8080', 'http://127.0.0.1:8080');
}

// Use a restricted CORS configuration: allow only known origins.
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow non-browser requests (curl, server-to-server) which have no origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    // For disallowed origins, return a proper CORS error message
    return callback(new Error('Not allowed by CORS'));
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// setupRoutes добавя всички API рутери
setupRoutes(app);

// Добави admin routes
console.log('Setting up admin routes...');
app.use('/api/admin', adminRoutes);
console.log('Admin routes registered');

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Health Check рутер за Render и други load balancers
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is alive!' });
});

// Commented out error handler to test
// app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//     const status = err.status || err.statusCode || 500;
//     const message = err.message || "Internal Server Error";
//     console.error("❌ An error occurred:", err.stack);
//     res.status(status).json({ message });
// });

const port = parseInt(process.env.PORT || '3005');

app.listen(port, () => {
  console.log(`✅ [express] API server is listening on port ${port}`);
});