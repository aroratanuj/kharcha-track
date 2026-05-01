import { Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  INFO: 0,
  WARN: 1,
  ERROR: 2,
};

const envLevel = (process.env.LOG_LEVEL || 'ERROR').toUpperCase();

function parseLevel(level: string): LogLevel {
  if (level === 'INFO') return 'INFO';
  if (level === 'WARN') return 'WARN';
  return 'ERROR';
}

const minLevel = parseLevel(envLevel);
const logger = new Logger('HTTP');

function log(level: LogLevel, message: string) {
  const levelPriority = LOG_LEVEL_PRIORITY[level];
  const minPriority = LOG_LEVEL_PRIORITY[minLevel];

  if (levelPriority >= minPriority) {
    switch (level) {
      case 'ERROR':
        logger.error(message);
        break;
      case 'WARN':
        logger.warn(message);
        break;
      case 'INFO':
      default:
        logger.log(message);
        break;
    }
  }
}

export function logLevelMiddleware(req: Request, res: Response, next: NextFunction) {
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const { statusCode, statusMessage } = res;

    if (statusCode >= 500) {
      log('ERROR', `${method} ${originalUrl} ${statusCode} - ${statusMessage || 'Internal Server Error'}`);
    } else if (statusCode >= 400) {
      log('WARN', `${method} ${originalUrl} ${statusCode} - ${statusMessage || 'Client Error'}`);
    } else {
      log('INFO', `${method} ${originalUrl} ${statusCode}`);
    }
  });

  next();
}
