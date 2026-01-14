import './database/infrastructure/mongo/modules/adapters-mongo.imports';
import './database/infrastructure/postgres/modules/adapters-postgres.imports';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';

// Importamos las clases para recuperarlas del contenedor
import { AllExceptionsFilter } from './core/infrastructure/filters/all-exceptions.filter';
import { ResultInterceptor } from './core/infrastructure/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. CONFIGURACIÓN GLOBAL
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: [{ path: '.well-known/assetlinks.json', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 2. EXTRACCIÓN DINÁMICA DE COMPONENTES
  // Al usar CoreModule con useExisting, esto funciona perfectamente:
  const filterName = app.get(AllExceptionsFilter).constructor.name;
  const interceptorName = app.get(ResultInterceptor).constructor.name;

  // 3. INICIO DEL SERVIDOR
  const port = process.env.PORT || 3000;
  const dbType = process.env.DB_GLOBAL_TYPE || 'mongo';

  await app.listen(port);

  // 4. IMPRESIÓN DEL BANNER
  printQuizzyBanner(port, dbType, filterName, interceptorName);
}

function printQuizzyBanner(
  port: string | number, 
  dbType: string, 
  filter: string, 
  interceptor: string
) {
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
  console.log(`${header} 📁 ${bold}Global prefix:${reset}           ${magenta}/api${reset}`);
  console.log(`${header} 🌐 ${bold}CORS enabled:${reset}            ${green}true${reset}`);
  console.log(`${header} 🛡️  ${bold}Exception Filter:${reset}       ${gray}${filter}${reset}`);
  console.log(`${header} 🔄 ${bold}Response Interceptor:${reset}   ${gray}${interceptor}${reset}`);
  console.log(`${header} ${line}`);
}

bootstrap();