import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';

let cachedApp: INestApplication;
const server: Express = express();

async function bootstrap(): Promise<INestApplication> {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    
    // Enable global validation pipe for DTOs
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    app.enableCors();
    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

// Vercel Serverless Function Handler
export default async (req: any, res: any) => {
  await bootstrap();
  server(req, res);
};

// Local Development Support
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then(app => {
    const port = process.env.PORT ?? 3000;
    app.listen(port, () => {
      console.log(`[TPS] Forensic Server listening on port ${port}`);
    });
  });
}
