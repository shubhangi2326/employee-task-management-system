import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import employeeRoutes from './routes/employeeRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS Configuration
const configuredClientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const staticAllowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'https://roots-employee-task-management.vercel.app',
  ...configuredClientUrls
]);

// Allow only production domain and preview URLs belonging to this specific project
const projectPreviewRegex = /^https:\/\/roots-employee-task-management(-[a-z0-9-]+)?\.vercel\.app$/i;

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser, same-origin, curl, or server-to-server requests
  const normalizedOrigin = origin.trim().replace(/\/+$/, '');
  return staticAllowedOrigins.has(normalizedOrigin) || projectPreviewRegex.test(normalizedOrigin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    // Disallow origin gracefully without throwing an unhandled Express 500 error
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Employee & Task Management API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
