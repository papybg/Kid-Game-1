import express from "express";
import cors from "cors";
import adminRoutes from "./adminRoutes-test";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS настройки
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// Простa health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Добави admin routes
app.use('/api/admin', adminRoutes);

const port = 3005;

app.listen(port, () => {
  console.log(`✅ Simple server is listening on port ${port}`);
  console.log(`🚀 Test with: http://localhost:${port}/api/health`);
});