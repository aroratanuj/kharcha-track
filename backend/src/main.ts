import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LogLevelMiddleware } from './common/log-level.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:8081',
      'exp://localhost:19000',
      'http://localhost:19006',
      process.env.MOBILE_APP_URL || '*',
    ].filter(Boolean),
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
  app.use(new LogLevelMiddleware());

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 KTS Backend is running on: http://localhost:${port}`);
  console.log(`📧 Email webhook endpoint: http://localhost:${port}/api/email/webhook`);
  console.log(`📝 Log level: ${process.env.LOG_LEVEL || 'ERROR'}`);
}

bootstrap();
