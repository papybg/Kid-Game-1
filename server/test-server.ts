import express from "express";
import cors from "cors";
import adminRoutes from "./adminRoutes-test";

const app = express();
app.use(express.json());

// Add CORS for localhost:8080
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Add admin routes
app.use('/api/admin', adminRoutes);

const port = 3007;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
});