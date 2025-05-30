const path = require('path');

const logger = require('./src/logger');

const envFile = path.join(__dirname, '.env.jest');

require('dotenv').config({ path: envFile });

logger.info(`Using LOG_LEVEL=${process.env.LOG_LEVEL}. Use 'debug' in env.jest for more detail`);

module.exports = {
  verbose: true,
  testTimeout: 5000,
};
