import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { logLevelMiddleware } from './common/log-level.middleware';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '1mb' }));

  const allowedOrigins = [
    'http://localhost:8081',
    'exp://localhost:19000',
    'http://localhost:19006',
    process.env.MOBILE_APP_URL,
  ].filter(Boolean);

  if (!allowedOrigins.length) {
    throw new Error('MOBILE_APP_URL must be set in production');
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.setGlobalPrefix('api');
  app.use(logLevelMiddleware);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}

bootstrap();
