require('dotenv').config();
const { sequelize, testConnection } = require('../config/database');

// Import models to ensure they're registered with Sequelize
const models = require('../models');

const run = async () => {
  await testConnection();

  const force = process.env.DB_SYNC_FORCE === 'true';
  const alter = process.env.DB_SYNC_ALTER !== 'false'; // default to true

  try {
    console.log(`Starting sequelize.sync({ force: ${force}, alter: ${alter} })`);
    await sequelize.sync({ force, alter });
    console.log('✅ Models synchronized with database successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to synchronize models:', err.message || err);
    process.exit(1);
  }
};

run();
