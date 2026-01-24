import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as nodeCrypto from 'node:crypto';
import { AppModule } from './app.module';

// Ensure global crypto exists for libraries expecting Web Crypto.
if (!('crypto' in globalThis)) {
  (globalThis as unknown as { crypto: typeof nodeCrypto }).crypto = nodeCrypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - supports comma-separated list of origins
  // Use '*' or true for tunnel/development access
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3008'];

  app.enableCors({
    origin: process.env.CORS_ALLOW_ALL === 'true' ? true : corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
