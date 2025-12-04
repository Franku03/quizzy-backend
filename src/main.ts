import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // TODO: Agregar global pipes para cuando empieze a ser necesario
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // TODO: Habilitar CORS

  const logger = new Logger('Bootstrap');

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`App running on port ${process.env.PORT || 3000}`);
}
bootstrap();
