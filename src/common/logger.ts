import * as winston from 'winston';
import { name } from '../../package.json';
import { LoggingWinston } from '@google-cloud/logging-winston';

type Transports = (
  | winston.transports.ConsoleTransportInstance
  | LoggingWinston
)[];

const loggingWinston = new LoggingWinston({
  projectId: process.env.FIREBASE_PROJECT_ID,
  logName: 'cloud_backend_log',
  serviceContext: {
    service: name,
  },
});

const transports: Transports = [
  new winston.transports.Console({
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.simple(),
    ),
  }),
];

if (
  process.env.NODE_ENV === 'production' ||
  process.env.NODE_ENV === 'staging' ||
  process.env.NODE_ENV === 'development'
) {
  transports.push(loggingWinston);
}

const Logger: winston.Logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.simple(),
  ),
  transports,
});

export { Logger };
