import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables reliably from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // fallback to cwd

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Bargain Bazaar API is running' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Do not accept API requests until the database is ready.
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✓ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch {
    console.error('✗ Server startup aborted because MongoDB could not be reached.');
    process.exit(1);
  }
};

startServer();
