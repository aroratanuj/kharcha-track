import { Logger, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  INFO: 0,
  WARN: 1,
  ERROR: 2,
};

@Injectable()
export class LogLevelMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly minLevel: LogLevel;

  constructor() {
    const envLevel = (process.env.LOG_LEVEL || 'ERROR').toUpperCase();
    this.minLevel = this.parseLevel(envLevel);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const { statusCode, statusMessage } = res;

      if (statusCode >= 500) {
        this.log('ERROR', `${method} ${originalUrl} ${statusCode} - ${statusMessage || 'Internal Server Error'}`);
      } else if (statusCode >= 400) {
        this.log('WARN', `${method} ${originalUrl} ${statusCode} - ${statusMessage || 'Client Error'}`);
      } else {
        this.log('INFO', `${method} ${originalUrl} ${statusCode}`);
      }
    });

    next();
  }

  private log(level: LogLevel, message: string) {
    const levelPriority = LOG_LEVEL_PRIORITY[level];
    const minPriority = LOG_LEVEL_PRIORITY[this.minLevel];

    if (levelPriority >= minPriority) {
      switch (level) {
        case 'ERROR':
          this.logger.error(message);
          break;
        case 'WARN':
          this.logger.warn(message);
          break;
        case 'INFO':
        default:
          this.logger.log(message);
          break;
      }
    }
  }

  private parseLevel(level: string): LogLevel {
    if (level === 'INFO') return 'INFO';
    if (level === 'WARN') return 'WARN';
    return 'ERROR';
  }
}
