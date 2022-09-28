const winston = require('winston')
require('winston-daily-rotate-file')

const transports = [
  new winston.transports.DailyRotateFile({
    filename: 'application-%DATE%.log',
    dirname: './logs/',
    level: 'info',
    handleExceptions: false,
    colorize: true,
    json: false,
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  }),
  new winston.transports.Console({ level: 'info', handleExceptions: true, colorize: true })
]

module.exports = winston.createLogger({ transports, exitOnError: false })
