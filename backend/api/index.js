'use strict';
require('reflect-metadata');

const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');

const server = express();
let isReady = false;
let bootstrapPromise = null;

async function bootstrap() {
  if (isReady) return;

  const { AppModule } = require('../dist/app.module');
  const { AllExceptionsFilter } = require('../dist/common/filters/http-exception.filter');

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn', 'log'],
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }),
  );

  const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, cb) =>
      !origin || origins.includes(origin)
        ? cb(null, true)
        : cb(new Error(`CORS blocked: ${origin}`)),
    credentials: true,
  });

  await app.init();
  isReady = true;
}

module.exports = async (req, res) => {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((err) => {
      console.error('Bootstrap failed:', err);
      bootstrapPromise = null;
      throw err;
    });
  }
  await bootstrapPromise;
  server(req, res);
};
