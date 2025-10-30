require('dotenv').config();
const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const models = require('./models');

const PORT = process.env.PORT || 5000;

// Initialize server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database models
    // IMPORTANT: Use { force: false } in production to prevent data loss
    // Use { alter: true } for development (carefully - it may lose data)
    // Use { force: true } only for development reset
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized (alter mode)');
    } else {
      await sequelize.sync();
      console.log('✅ Database models synchronized');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  🚀 Retail Automation API Server      ║
║  Environment: ${process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}              ║
║  Port: ${PORT}                           ║
║  Database: Connected                   ║
╚════════════════════════════════════════╝
      `);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received. Closing server gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 SIGINT received. Closing server gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();
