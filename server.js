require('dotenv').config();
const app    = require('./src/config/app');
const db     = require('./src/config/db');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test DB connection
    await db.testConnection();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

startServer();
