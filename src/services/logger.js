const winston = require('winston');
const WinstonRotate = require('winston-daily-rotate-file');
const { env } = require('config')

const transports = [
  new  winston.transports.DailyRotateFile ({
    filename:  'application-%DATE%.log',
    dirname:  './logs/',
    level:  'info',
    handleExceptions:  true,
    colorize:  true,
    json:  false,
    zippedArchive:  true,
    maxSize:  '20m',
    maxFiles:  '14d'
  }),
  new winston.transports.Console({ level: 'info' })
]

module.exports = winston.createLogger({ transports, exitOnError:  false })
