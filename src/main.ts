// src/main.ts
import './database/infrastructure/mongo/modules/adapters-mongo.imports';
import './database/infrastructure/postgres/modules/adapters-postgres.imports';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';

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
  app.setGlobalPrefix('api', {
    exclude: [{ path: '.well-known/assetlinks.json', method: RequestMethod.GET }],
  });

  // 3. Global pipes (Maneja fallos de validación de entrada antes de llegar al handler)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  //  4. REGISTRO GLOBAL DEL FILTRO DE EXCEPCIONES

  // const errorMappingService = app.get(ErrorMappingService);
  // app.useGlobalFilters(new AllExceptionsFilter(errorMappingService));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const dbType = process.env.DB_GLOBAL_TYPE || 'mongo';
  printQuizzyBanner(port, dbType);
}

function printQuizzyBanner(port: string | number, dbType: string) {
  const reset = '\x1b[0m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const cyan = '\x1b[36m';
  const magenta = '\x1b[35m';
  const gray = '\x1b[90m';
  const bold = '\x1b[1m';

  const timestamp = new Date().toLocaleString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  const dbName = dbType.toUpperCase();
  const dbColor = dbType === 'mongo' ? green : cyan;
  const dbIcon = dbType === 'mongo' ? '🍃' : '🐘';

  const header = `${green}[Quizzy]${reset} ${gray}- ${reset}${timestamp}    ${green}LOG ${reset}${yellow}[Bootstrap]${reset}`;

  const line = `${green}================================================================${reset}`;

  console.log(`${header} ${line}`);
  console.log(`${header} 🚀 ${bold}App running on port:${reset}     ${yellow}${port}${reset}`);
  console.log(`${header} ${dbIcon} ${bold}Database Type:${reset}          ${dbColor}${dbName}${reset}`);
  console.log(`${header} 🕹️  ${bold}WS Server port:${reset}         ${yellow}${port}${reset}`);
  console.log(`${header} 📁 ${bold}Global prefix:${reset}          ${magenta}/api${reset}`);
  console.log(`${header} 🌐 ${bold}CORS enabled:${reset}           ${green}true${reset}`);
  console.log(`${header} ✅ ${bold}Exception Filter:${reset}       ${gray}AllExceptionsFilter${reset}`);
  console.log(`${header} ${line}`);
}
bootstrap();