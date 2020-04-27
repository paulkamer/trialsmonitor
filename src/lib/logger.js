const winston = require('winston');

const consoleTransport = new winston.transports.Console();
const options = {
  level: process.env.LOG_LEVEL || 'info',
  silent: process.env.DISABLE_LOGGING === '1', // used for running tests
  format: winston.format.combine(
    // winston.format.timestamp({
    //   format: 'YYYY-MM-DD HH:mm:ss'
    // }),
    winston.format.errors({ stack: false }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [consoleTransport]
};

const logger = new winston.createLogger(options);

module.exports = { logger };