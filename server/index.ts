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

// За локална разработка, позволяваме заявки от Vite сървъра на порт 8080 и 8081
app.use(cors({ origin: ['http://localhost:8080', 'http://localhost:8081'], credentials: true }));

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

// Commented out error handler to test
// app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//     const status = err.status || err.statusCode || 500;
//     const message = err.message || "Internal Server Error";
//     console.error("❌ An error occurred:", err.stack);
//     res.status(status).json({ message });
// });

const port = parseInt(process.env.PORT || '3500');

app.listen(port, '127.0.0.1', () => {
  console.log(`✅ [express] API server is listening on http://localhost:${port}`);
});