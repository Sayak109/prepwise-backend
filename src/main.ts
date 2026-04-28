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

  app.enableCors({
    origin: true,
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(port, () => {
    console.log(`Server running on -> http://localhost:${port}`);
  });
}
void bootstrap();
