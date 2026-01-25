import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as nodeCrypto from 'node:crypto';
import { AppModule } from './app.module';

// Ensure global crypto exists for libraries expecting Web Crypto.
if (!('crypto' in globalThis)) {
  (globalThis as unknown as { crypto: typeof nodeCrypto }).crypto = nodeCrypto;
}

async function bootstrap() {
  // Disable default body parser to configure custom limits for image uploads
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Increase body parser limit for base64 encoded image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS - supports comma-separated list of origins
  // Use '*' or true for tunnel/development access
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:3008',
        'https://alignia.io',
        'https://app.alignia.xyz',
      ];

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
