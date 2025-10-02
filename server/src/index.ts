import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import articleRoutes from './routes/articles';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase } from './utils/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files - try multiple possible locations
const possiblePaths = [
  path.join(__dirname, '../../public'),
  path.join(process.cwd(), 'public'),
  path.join(__dirname, '../../../public'),
  './public'
];

let staticPath = null;
const fs = require('fs');

for (const pathToTry of possiblePaths) {
  try {
    if (fs.existsSync(pathToTry)) {
      staticPath = pathToTry;
      console.log('✅ Found static files at:', staticPath);
      break;
    }
  } catch (error) {
    // Continue to next path
  }
}

if (staticPath) {
  app.use(express.static(staticPath));
} else {
  console.log('⚠️ No static files found. App will serve API only.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Catch all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();