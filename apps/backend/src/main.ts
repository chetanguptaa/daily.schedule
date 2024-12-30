import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { ZodFilter } from './zod/zod.exception';

async function getApplicationInstance(): Promise<INestApplication<any>> {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  if (configService.get('NODE_ENV') !== 'production') {
    app.enableCors({
      origin: 'http://localhost:5173',
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: '',
      credentials: true,
    });
  }
  app.setGlobalPrefix('/api');
  app.use(cookieParser());
  app.use(helmet());
  app.useGlobalFilters(new ZodFilter());
  return app;
}

async function bootstrap() {
  const app = await getApplicationInstance();
  const configService: ConfigService = app.get(ConfigService);
  const port = configService.get('PORT');
  await app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
}
bootstrap();
