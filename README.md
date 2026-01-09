<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

# Kahoot Clone Backend - NestJS 🚀

## Configuración del Proyecto 🛠️

```bash
yarn install
```

## Compilar y ejecutar en modo desarrollador 🧠

### Configurar Variables de Entorno
1. Crea una copia del archivo `.env.template` y renómbralo a `.env`.
2. Configura las variables para establecer la conexión con la base de datos elegida (PostgreSQL o MongoDB).
3. Importante: Si utilizas un cluster de MongoDB Atlas, coloca la URL en la variable `MONGO_CNN`.

### Levantar Bases de Datos (Docker)

**PostgreSQL**
```bash
docker compose -f docker-compose.dev.postgres.yaml up -d
```

**MongoDB**
```bash
docker compose -f docker-compose.dev.mongo.yaml up -d
```

### Ejecutar el Proyecto

```bash
# development mode (watch)
yarn run start:dev

# production mode
yarn start:prod
```

## 🚀 Ejecución del Backend con Docker Compose

1. Configurar entorno:
   - `MONGO_HOST=mongo`
   - `DB_HOST=postgres`

2. Levantar servicios:

**MongoDB**
```bash
docker compose -f docker-compose.local.mongo.yaml up -d
```

**PostgreSQL**
```bash
docker compose -f docker-compose.local.postgres.yaml up -d
```

3. Acceso:
- HTTP API: http://localhost:3000/api
- WebSockets: ws://localhost:3000/multiplayer-sessions

## 🪛 Correr Tests

```bash
yarn run test        # Unit tests
yarn run test:e2e    # E2E tests
yarn run test:cov    # Coverage
```

## 🏗️ Arquitectura y Diseño

El backend está estructurado siguiendo Arquitectura Hexagonal (Ports & Adapters) y Domain-Driven Design (DDD).
Cada módulo representa su propio hexágono, fomentando la separación de responsabilidades.

---

### 🗺️ Modelo de Dominio

Para una comprensión visual profunda de las entidades, agregados y sus relaciones, disponemos de una representación gráfica detallada:

> [!TIP]
> 🎨 **[Acceder al Diagrama del Modelo de Dominio](https://lucid.app/lucidchart/ece44902-e188-405b-98a2-99114bfce612/edit?invitationId=inv_5ebb1b27-3046-48d7-bb6f-ddbeccdac5bc&page=5WW8gG8tv4Q4#)**
> _Plataforma: LucidChart_

---


### Estructura de Capas por Módulo

🟡 Domain (Núcleo)
- entities
- value-objects
- aggregates
- domain-services
- repositories 

🟣 Application
- command
- query
- application-services
- dtos

🔵 Infrastructure
- nest-js (controllers, gateways)
- external-services
- repositories (Mongoose / TypeORM)

## 🚨 Arquitectura de Errores y Flujo ROP

### 1. Objeto ErrorData
- errorId único para trazabilidad
- acumulación progresiva de contexto técnico y de negocio
- sanitización automática de errores de infraestructura

### 2. Either<L, R> y pipeAsync
- Left: ErrorData (fallo)
- Right: Resultado exitoso
- Short-circuit: el flujo se detiene al primer error
---
### 📌 DIAGRAMA DE SECUENCIA (ERRORES / ROP)

> El siguiente diagrama describe el flujo completo de ejecución, incluyendo el manejo de errores mediante Railway Oriented Programming.

---

```mermaid
sequenceDiagram
    autonumber

    %% --- PARTICIPANTES (DIP ALIAS) ---
    participant Client as Cliente
    Note over Ctrl: [Controller] KahootController
    participant Ctrl as Ctrl
    
    Note over Decorator: [Decorator] Authorize
    participant Decorator as Deco
    
    Note over Auth: [IAuthorizer] KahootOwnershipAuthorizer
    participant Auth as Auth

    Note over Repo: [IKahootRepository] KahootRepositoryMongo
    participant Repo as Repo

    Note over Factory: [DomainFactory] KahootFactory
    participant Factory as Fact

    Note over Handler: [ICommandHandler] UpdateKahootHandler
    participant Handler as Hand

    Note over Agg: [Domain] Kahoot / VOs
    participant Agg as Agg

    Note over Exec: [Service] Executor / Bridge
    participant Exec as Exec

    Note over Filter: [ExceptionFilter] AllExceptionsFilter
    participant Filter as Filt

    %% --- FASE 1: AUTH & RECONSTRUCTION ---
    Client->>Ctrl: PUT /kahoots/:id
    Ctrl->>Decorator: executeCommand(cmd)

    rect rgb(243, 229, 245)
        Note right of Decorator: FASE 1: SEGURIDAD (Capa Aplicacion)
        Decorator->>Auth: authorize(command, context)

        rect rgb(227, 242, 253)
            Note right of Repo: RECONSTRUCCION DE DOMINIO (Capa Infra)
            Auth->>Repo: findKahootByIdEither(id)
            Repo->>Repo: mongoModel.findOne()
            
            rect rgb(255, 249, 196)
                Note right of Factory: VALIDACION DE AGREGADO (Capa Dominio)
                Repo->>Factory: reconstructFromSnapshot(snap)
                Note over Factory: Revalida VOs (SlideId, Points, etc.)
                Factory-->>Repo: Either (Left o Right)
            end
            Repo-->>Auth: Either (Left o Right)
        end
        
        Note over Auth: Valida Reglas de Acceso (Ownership, Status)
        Auth-->>Decorator: Either (Left o Right)
        
        alt isLeft (Falla Seguridad o Dominio)
            Decorator-->>Ctrl: Return Either.Left (Cortocircuito)
        else isRight (Todo OK)
            Decorator->>Decorator: command.validatedResource = kahoot
        end
    end

    %% --- FASE 2: USE CASE (pipeAsync) ---
    rect rgb(243, 229, 245)
        Note right of Handler: FASE 2: LOGICA DE NEGOCIO (Capa Aplicacion)
        Decorator->>Handler: execute(command)

        rect rgb(230, 242, 255)
            Note right of Handler: Bucle pipeAsync (Railway Oriented Programming)
            
            Note over Handler: Paso 1: Mutacion de Dominio
            Handler->>Agg: applyUpdates()
            Agg-->>Handler: Either.Right(kahoot)

            rect rgb(255, 235, 235)
                Note over Handler: Paso 2: Persistencia (Simulacion de Fallo)
                Handler->>Repo: saveKahootEither(kahoot)
                Repo-->>Handler: Either.Left(ErrorData INFRA)
                
                Note over Handler: CORTOCIRCUITO: pipeAsync detecta Left
                Note over Handler: break loop (Se detiene el tren)
            end
        end

        Handler->>Handler: err.setContext(appContext)
        Note over Handler: Agrega ActorId y Operacion al ErrorData
        Handler-->>Decorator: Return Either.Left(ErrorData)
    end

    Decorator-->>Ctrl: Propaga Either.Left

    %% --- FASE 3: BRIDGE & FILTER ---
    rect rgb(227, 242, 253)
        Note right of Exec: EXCEPTION BRIDGE (Puente a NestJS)
        Ctrl->>Exec: throwResult(result)
        Note over Exec: if result.isLeft then throw ErrorData
        Exec-->>Filter: Lanza Excepcion capturada por AllExceptionsFilter

        Note right of Filter: FILTRO GLOBAL (Capa Infra)
        Filter->>Filter: logger.error(toLogString)
        Note over Filter: Log visual en negro/colores con StackTrace
        Filter->>Filter: sanitizeDetails(error)
        Note over Filter: Oculta DB e Infra si es un error critico
        Filter-->>Client: HTTP Response (JSON IErrorResponse)
    end
```


### 🔗 RECURSOS EXTERNOS PARA LOS ERRORES
Para una experiencia visual mejorada y acceso a la edición del diagrama, utiliza el siguiente enlace:

> 🎨 **[Acceder al Diagrama en Eraser.io](https://app.eraser.io/workspace/w9byiD8Kuq4CRJ47rOU8?origin=share)**

---

## 📁 Guía de Directorios


### ⚛️ src/core

| Capa | Responsabilidad |
| :--- | :--- |
| **`domain/`** | **Núcleo de Negocio**: Abstracciones base (`AggregateRoot`, `Entity`, `ValueObject`), Eventos de Dominio y objetos de valor compartidos (IDs, fechas, puntos). |
| **`application/`** | **Puertos y Orquestación**: Definición de contratos (`ports`), lógica de seguridad (`auth`), decoradores de autorización y la interfaz del Bus de CQRS. |
| **`infrastructure/`** | **Implementaciones Técnicas**: Adaptadores reales para criptografía, generación de IDs (UUID), y la implementación física de los buses (Memory/Pino). |
| **`errors/`** | **Gestión de Fallos (ROP)**: Sistema centralizado de errores con factorías, contextos y el `pipe-async` para composición de flujos. |
| **`types/`** | **Tipado Funcional**: Tipos base para el control de flujo como `Either.ts` (éxito/error) y `Optional.ts`. |
| **`nest-js/`** | **Integración**: Decoradores y controladores base específicos para el ciclo de vida de NestJS. |

### 🧩 Anatomía de un Módulo (`src/[modulo]`)

Cada módulo sigue su propio hexágono, asegurando que la lógica de negocio no dependa de la tecnología externa.

| Capa | Contenido | Objetivo |
| :--- | :--- | :--- |
| **`domain/`** | Entidades, Agregados, Repositorios (Interfaces) | Definir las reglas de negocio puras del módulo. |
| **`application/`** | Casos de Uso, Command/Query Handlers, DTOs | Orquestar la lógica y transformar datos de entrada. |
| **`infrastructure/`** | Controladores, Adaptadores de BD, Mappers | Implementar la comunicación con el mundo exterior. |

---

### 🗄️ Capa de Datos (`src/database`)

Diseñada para ser agnóstica al motor de persistencia, permitiendo alta escalabilidad y flexibilidad.

| Componente | Funcionalidad |
| :--- | :--- |
| **Configuración** | Gestión de conexiones para **TypeORM** y **Mongoose**. |
| **Intercambio Dinámico** | Capacidad de conmutar entre motores de BD (SQL/NoSQL) según el entorno o necesidad. |
| **Patrón Repositorio** | Implementaciones concretas que desacoplan el dominio de la base de datos elegida. |

---
## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Gustavo Kufatty, Luis Monroy, Luis Ochoa, Franklin Quintana, Sergio Rodríguez, Santiago Silva.
