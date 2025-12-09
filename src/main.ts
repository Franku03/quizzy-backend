// src/main.ts (Versión Final)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

import { AllExceptionsFilter } from './core/infrastructure/filters/all-exceptions.filter'; 
import { ErrorMappingService } from './core/infrastructure/services/global-error-mapping.service'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. HABILITA CORS (CRÍTICO para Render)
  app.enableCors({
    origin: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // 2. Global prefix
  app.setGlobalPrefix('api');
  
  // 3. Global pipes (Maneja fallos de validación de entrada antes de llegar al handler)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: true, 
    }),
  );

  //  4. REGISTRO GLOBAL DEL FILTRO DE EXCEPCIONES
  
  const errorMappingService = app.get(ErrorMappingService); 
  app.useGlobalFilters(new AllExceptionsFilter(errorMappingService));

  const logger = new Logger('Bootstrap');
  
  // 5. Port setup
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // 6. Log Inicial
  logger.log(`=================================`);
  logger.log(`🚀 App running on port: ${port}`);
  logger.log(`🕹️ WS Server running on port: ${ port }`);
  logger.log(`📁 Global prefix: /api`);
  logger.log(`🌐 CORS enabled: true`);
  logger.log(`✅ Exception Filter enabled: AllExceptionsFilter`);
  logger.log(`=================================`);
}

bootstrap();