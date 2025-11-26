require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
const models = require('./models');

const app = express();

// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Server is running!'
    });
});

// Routes - Use correct path
const authRoutes = require('./routes/authRoutes'); // Match your actual file name
app.use('/api/auth', authRoutes);

// Import product routes
const productRoutes = require('./routes/productRoutes');

// Register product routes
app.use('/api/products', productRoutes);

// Import category routes
const categoryRoutes = require('./routes/categoryRoutes');

// Register category routes
app.use('/api/categories', categoryRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;

// Initialize server
const startServer = async() => {
    try {
        await testConnection();

        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database models synchronized (alter mode)');
        } else {
            await sequelize.sync();
            console.log('✅ Database models synchronized');
        }

        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════╗
║  🚀 Retail Automation API Server      ║
║  Environment: ${process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}              ║
║  Port: ${PORT}                           ║
║  Database: Connected                   ║
║  CORS: Enabled for localhost:5173     ║
╚════════════════════════════════════════╝
      `);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown handlers
process.on('SIGTERM', async() => {
    console.log('👋 SIGTERM received. Closing gracefully...');
    await sequelize.close();
    process.exit(0);
});

process.on('SIGINT', async() => {
    console.log('👋 SIGINT received. Closing gracefully...');
    await sequelize.close();
    process.exit(0);
});

startServer();