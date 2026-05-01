import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

const port = process.env.PORT || 6969;
const expressApp = express();

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI, // adds `/v1`
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // transform: true,
      whitelist: true,
    }),
  );

  const allowedOrigins = [
    process.env.WEB_BASE_PATH?.replace(/\/$/, ''),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  app.use(cookieParser());

  await app.listen(port, () => {
    console.log(`Server running on -> http://localhost:${port}`);
  });
}
void bootstrap();
