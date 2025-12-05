import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. HABILITA CORS (CRÍTICO para Render)
  app.enableCors({
    origin: true, // Permite todos los orígenes (en producción especifica URLs)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // 2. Global prefix
  app.setGlobalPrefix('api');
  
  // 3. Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: true, 
    }),
  );

  const logger = new Logger('Bootstrap');
  
  // 4. Usa el puerto correctamente
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // 5. Log más informativo
  logger.log(`=================================`);
  logger.log(`🚀 App running on port: ${port}`);
  logger.log(`🕹️ WS Server running on port: ${ process.env.WEB_SOCKET_SERVER_PORT || 3003 }`);
  logger.log(`📁 Global prefix: /api`);
  logger.log(`🌐 CORS enabled: true`);
  logger.log(`=================================`);
}

bootstrap();