// Start Instagram token auto-refresh scheduler
require('./autoRefreshInstagramToken');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy (important for production behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware - apply first
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/marketing', require('./routes/marketing'));

// 404 handler (Express 5 compatible - wildcard must be named)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});


// Debug log every request URL before 404 handler
app.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  next();
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
