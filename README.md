# Kahoot Clone Backend - NestJS 🚀

<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="Postgres" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/MongoDB%20Atlas-001E2B?style=for-the-badge&logo=mongodb&logoColor=00ED64" alt="MongoDB Atlas" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Pino-636363?style=for-the-badge&logo=pino&logoColor=white" alt="Pino Logger" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
</p>

---

<div align="center">

## 🛠️ Stack Tecnológico

| Categoría | Tecnologías Utilizadas |
| :--- | :--- |
| **Framework Core** | **NestJS** (Node.js) con **TypeScript** |
| **Comunicación Real-time** | **Socket.io** (WebSockets) |
| **Notificaciones Push** | **Firebase Cloud Messaging** (FCM) |
| **Persistencia (Cloud)** | **Supabase** (PostgreSQL) & **MongoDB Atlas** |
| **Persistencia (Local)** | **PostgreSQL** & **MongoDB** (Docker Containers) |
| **Gestión de Media** | **Cloudinary** (CDN & Storage) |
| **Infraestructura** | **Docker** & **Docker Compose** |
| **Logging** | **PinoLogger** |
| **Testing** | **Jest** |

</div>

---

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

## 🚨 Arquitectura de Errores y Eficiencia en el Motor V8

La implementación de **Railway Oriented Programming (ROP)** mediante el uso de `Either<L, R>` y `pipeAsync` proporciona beneficios críticos en la optimización del tiempo de ejecución y el aprovechamiento del motor **V8**:

### 1. Optimización del Compilador (Monomorfismo)
El motor V8 utiliza "Hidden Classes" e "Inline Caching" para optimizar el acceso a objetos. Al garantizar que todos los resultados de las funciones tengan una estructura consistente y predecible (`Either`), el sistema facilita que el compilador **JIT (Just-In-Time)** mantenga el código en su "vía rápida" (Hot Path), alcanzando velocidades de ejecución cercanas al código nativo al evitar la desoptimización por cambios de forma en los objetos de retorno.

### 2. Instanciación vs. Lanzamiento de Excepciones
Existe una diferencia fundamental en el consumo de recursos entre retornar un valor y lanzar una excepción:

- **Costo de la Excepción**: Cuando se ejecuta un `throw`, el motor V8 debe capturar el **Stack Trace** completo, una operación intensiva en CPU que implica inspeccionar la pila de llamadas y realizar múltiples concatenaciones de strings. Además, el proceso de **Stack Unwinding** (buscar el bloque `catch` correspondiente) interrumpe la tubería de instrucciones del procesador.

- **Eficiencia del Either**: Instanciar un objeto `Either` es una operación de asignación de memoria estándar y extremadamente ligera. Al tratar el error como un dato más, el flujo de ejecución permanece lineal. Para V8, recolectar estos objetos de vida corta en la "Young Generation" del montón (heap) es órdenes de magnitud más rápido que procesar el ciclo de vida de una excepción.

### 3. Maximización del Throughput (Short-circuit)
El mecanismo de **cortocircuito** de la utilidad `pipeAsync` optimiza el uso de recursos del sistema:

- **Gestión del Event Loop**: Al detener la ejecución al primer error, se evita la creación y el encolamiento de microtasks innecesarias en el Event Loop de Node.js.

- **Liberación de CPU**: El cese inmediato de la ejecución tras un fallo previene el consumo de ciclos de reloj en pasos posteriores (como enriquecimiento de datos o procesamiento de archivos), permitiendo al servidor gestionar un mayor volumen de peticiones concurrentes.

### 4. Continuidad del Hot Path
Los bloques `try/catch` históricamente han sido difíciles de optimizar para los compiladores JIT, limitando en ocasiones la capacidad de realizar **inlining** (insertar el código de una función dentro de otra). Al utilizar un flujo basado en retornos y condicionales simples (`if`), se facilita que el compilador realice optimizaciones avanzadas de flujo, manteniendo la ejecución en el nivel más alto de rendimiento.

> [!IMPORTANT]
> 🏗️ Ingeniería de Software de Alto Rendimiento:
> Esta arquitectura está diseñada desde la perspectiva de la ingeniería de Software, destacando por qué es la opción más escalable para un backend de alto rendimiento como lo es una app de quizzes.

---

## 📦 Componentes de la Arquitectura ROP

### 1. Clase ErrorData
La clase `ErrorData` encapsula toda la información de error de manera estructurada, proporcionando:

**Propiedades Principales**:
- `errorId`: UUID único generado con `randomUUID()` para trazabilidad
- `code`: Código de error identificativo
- `layer`: Capa del sistema donde ocurrió (`ErrorLayer`)
- `timestamp`: Fecha y hora exacta del error
- `message`: Descripción legible del error
- `stackTrace`: Stack trace del error (en desarrollo)
- `details`: Contexto técnico y de negocio (`IErrorContext`)
- `innerError`: Error original (si aplica)

**Características Avanzadas**:
- **Acumulación Contextual**: El método `setContext()` permite enriquecer progresivamente el contexto del error con información específica de cada capa.
- **Sanitización Automática**: Protección de campos sensibles del dominio y control jerárquico sobre la propiedad `operation`.
- **Regla de Operación**: Una vez que un error alcanza la capa `APPLICATION`, el nombre de la operación se vuelve inmutable, previniendo sobrescrituras incorrectas desde capas inferiores.

> [!WARNING]
> ⚠️ Seguridad en Producción:
>  Para futuras revisiones, se implementará un mecanismo basado en `process.env.NODE_ENV` que eliminará automáticamente el `stackTrace` (evitando referenciar el constructor de error con super) en entornos de producción (`isProd === true`), manteniéndolo únicamente en desarrollo para facilitar el debugging.

**Formato de Log Estructurado**: El método `toLogString()` genera una representación visualmente clara del error con:
  - Codificación de colores por capa del sistema
  - Separadores distintivos para cada sección
  - Formato jerárquico para detalles y contexto

### 2. Clase Either<TLeft, TRight>
Implementación completa del patrón Either que sirve como contenedor de resultados:

**Estado y Acceso**:
- `isLeft()` / `isRight()`: Métodos de consulta del estado
- `getLeft()` / `getRight()`: Extracción segura de valores con validación de tipo

**Fábricas Estáticas**:
- `makeLeft()`: Crea una instancia representando un fallo (valor izquierdo)
- `makeRight()`: Crea una instancia representando un éxito (valor derecho)

**Transformaciones Sincrónicas**:
- `map()`: Transforma el valor Right manteniendo posibles Left
- `mapLeft()`: Transforma el valor Left manteniendo posibles Right
- `chain()`: Encadena operaciones que devuelven Either (validaciones secuenciales)

**Operaciones Asincrónicas**:
- `chainAsync()`: Encadena operaciones asíncronas que devuelven Promise<Either>
- `mapAsync()`: Transforma valores Right mediante promesas
- `tapChainAsync()`: Ejecuta efectos asíncronos manteniendo valores
- `tapLeftAsync()`: Ejecuta efectos solo en caso de error

**Flujos Condicionales**:
- `chainUnless()` / `chainUnlessAsync()`: Ejecuta encadenamiento solo si NO se cumple condición
- `mapUnlessAsync()`: Transforma valores solo si NO se cumple condición

**Utilidades Avanzadas**:
- `tryCatch()`: Elimina try-catch de promesas, convirtiéndolas en Either automáticamente
- `isEither()`: Type Guard para verificar instancias de Either

### 3. Función pipeAsync
Orquesta la ejecución secuencial de operaciones con mecanismo de cortocircuito:

**Características Principales**:
- **Cortocircuito Automático**: Detiene la ejecución inmediatamente al encontrar un error (valor Left)
- **Flexibilidad de Tipos**: Acepta Either o Promise<Either> como valor inicial
- **Adaptación Automática**: Detecta si un paso devuelve Either o valor plano, envolviéndolo adecuadamente
- **Pipeline Asíncrono**: Maneja automáticamente operaciones sincrónicas y asíncronas

**Flujo de Ejecución**:
1. Resolución del valor inicial (puede ser Promise)
2. Iteración secuencial por cada paso del pipeline
3. Detección automática de errores (break en el primer Left)
4. Casting final al tipo esperado de retorno

---
### 📌 DIAGRAMA DE SECUENCIA (ERRORES / ROP)
 
> El siguiente diagrama describe el flujo reducido del sistema de errores

---

```mermaid
%%{init: { 
  'theme': 'base', 
  'themeVariables': { 
    'actorLineColor': '#008000',
    'actorTextColor': '#000000', 
    'actorFontWeight': '900', 
    'noteTextColor': '#000000', 
    'noteFontWeight': '900', 
    'signalTextColor': '#000000', 
    'signalFontWeight': '900',
    'mainBkg': '#FFFFFF'
  }
}}%%
sequenceDiagram
    autonumber
    
    participant Client as 📱 Cliente
    participant App as 🟣 Aplicación
    participant Domain as 🟡 Dominio
    participant Infra as 🔵 Infraestructura

    rect rgb(245, 245, 245)
        Note over Client, Infra: FLUJO SIMPLIFICADO DE LA ARQUITECTURA (HEXAGONAL + ROP)
        
        Client->>App: 1. Petición (Controller)
        
        rect rgb(255, 255, 255)
            Note over App, Domain: 🛡️ SEGURIDAD Y RECONSTRUCCIÓN
            App->>Infra: Consultar Estado
            Infra->>Domain: Reconstruir Agregado (Factory)
            Domain-->>App: Retornar Objeto Válido
        end

        rect rgb(255, 255, 255)
            Note over App, Domain: 🛤️ LÓGICA ROP (pipeAsync)
            App->>Domain: Ejecutar Reglas de Negocio
            App->>Infra: Persistir Cambios
        end

        App-->>Client: 2. Respuesta DTO o Error Sanitizado
    end
```

---

> El siguiente diagrama describe el flujo completo de ejecución, incluyendo el manejo de errores mediante Railway Oriented Programming (UpdateKahootHandler).

---

```mermaid
%%{init: { 
  'theme': 'base', 
  'themeVariables': { 
    'actorLineColor': '#008000',
    'actorTextColor': '#000000', 
    'actorFontWeight': '900', 
    'noteTextColor': '#000000', 
    'noteFontWeight': '900', 
    'signalTextColor': '#000000', 
    'signalFontWeight': '900',
    'signalColor': '#000000'
  }
}}%%
sequenceDiagram
    autonumber

    %% --- PARTICIPANTES ---
    participant Client as Cliente
    participant Ctrl as Controller
    participant Deco as Decorator
    participant Auth as Authorizer
    participant Repo as Repository
    participant Fact as Factory
    participant Hand as Handler
    participant Agg as Aggregate
    participant Exec as Executor
    participant Filt as Filter

    Note over Ctrl: [Controller] KahootController
    Note over Deco: [Decorator] Authorize
    Note over Auth: [IAuthorizer] KahootOwnershipAuthorize
    Note over Repo: [IKahootRepository] KahootRepositoryMongo
    Note over Fact: [DomainFactory] KahootFactory
    Note over Hand: [ICommandHandler] UpdateKahootHandler
    Note over Agg: [Domain] Kahoot / Value Objects
    Note over Filt: [ExceptionFilter] AllExceptionsFilter

    %% --- FASE 1: AUTH & RECONSTRUCTION ---
    Client->>Ctrl: PUT /kahoots/:id
    Ctrl->>Deco: executeCommand(cmd)

    rect rgb(243, 229, 245)
        Note right of Deco: FASE 1: SEGURIDAD (Capa Aplicacion)
        Deco->>Auth: authorize(command, context)

        rect rgb(227, 242, 253)
            Note right of Repo: RECONSTRUCCION DE DOMINIO (Capa Infra)
            Auth->>Repo: findKahootByIdEither(id)
            Repo->>Repo: mongoModel.findOne()
            
            rect rgb(255, 250, 200)
                Note right of Fact: VALIDACION DE AGREGADO (Capa Dominio)
                Repo->>Fact: reconstructFromSnapshot(snap)
                Note over Fact: Revalida VOs e Invariantes
                Fact-->>Repo: Either (Left o Right)
            end
            Repo-->>Auth: Either (Left o Right)
        end
        
        Note over Auth: Valida Reglas de Acceso (Ownership, Status)
        Auth-->>Deco: Either (Left o Right)
        
        alt (Falla Seguridad o Dominio)
            Deco-->>Ctrl: Return Either.Left (Cortocircuito)
        else >isRight (Todo OK)
            Deco->>Deco: command.validatedResource = kahoot
        end
    end

    %% --- FASE 2: USE CASE (pipeAsync) ---
    rect rgb(243, 229, 245)
        Note right of Hand: FASE 2: LOGICA DE NEGOCIO (Capa Aplicacion)
        Deco->>Hand: execute(command)

        rect rgb(230, 242, 255)
            Note right of Hand: Bucle pipeAsync (Railway Oriented Programming)
            
            Note over Hand: Paso 1: Mutacion de Dominio
            Hand->>Agg: applyUpdates()
            Agg-->>Hand: >Either.Right(kahoot)

            rect rgb(255, 235, 235)
                Note over Hand: Paso 2: Persistencia (Simulacion de Fallo)
                Hand->>Repo: saveKahootEither(kahoot)
                Repo-->>Hand: Either.Left(ErrorData INFRA)
                
                Note over Hand: CORTOCIRCUITO: pipeAsync detecta Left
                Note over Hand: break loop (Se detiene el tren)
            end
        end

        Hand->>Hand: err.setContext(appContext)
        Note over Hand: Agrega ActorId y Operacion al ErrorData
        Hand-->>Deco: Return Either.Left(ErrorData)
    end

    Deco-->>Ctrl: Propaga Either.Left

    %% --- FASE 3: BRIDGE & FILTER ---
    rect rgb(227, 242, 253)
        Note right of Exec: EXCEPTION BRIDGE (Puente a NestJS)
        Ctrl->>Exec: throwResult(result)
        Note over Exec: result.isLeft -> throw ErrorData
        Exec-->>Filt: Lanza Excepcion para AllExceptionsFilter

        Note right of Filt: FILTRO GLOBAL (Capa Infra)
        Filt->>Filt: logger.error(toLogString)
        Note over Filt: Log visual detallado con StackTrace
        Filt->>Filt: sanitizeDetails(error)
        Note over Filt: Oculta DB e Infra si es un error critico
        Filt-->>Client: HTTP Response (JSON IErrorResponse)
    end
```

### 🔗 RECURSOS EXTERNOS PARA LOS ERRORES
Para una experiencia visual mejorada y acceso a la edición del diagrama, utiliza el siguiente enlace:

> 🎨 **[Acceder al Diagrama en Eraser.io](https://app.eraser.io/workspace/w9byiD8Kuq4CRJ47rOU8?origin=share)**

---

# 🧩 Media Module: MediaEnrichmentService El Serivcio MVP 
### *Abstracción de Infraestructura y Enriquecimiento de Dominio*

El **Media Module**, Ademas de tener unos endpoints. Presenta el `MediaEnrichmentService` que no es solo un servicio de utilidad; es un servicio que actúa como un **cross cutting concertl**. Su existencia resuelve el conflicto entre tener un **Dominio puro** (basado en IDs y lógica de negocio) y las necesidades de una **Interfaz de Usuario** (que requiere URLs firmadas, transformaciones de imagen y metadatos).


#### 🎯 Visión y Propósito Estratégico
* **Desacoplamiento Total:** Los agregados de dominio (como `Kahoot` o `Question`) no almacenan URLs de Cloudinary. Esto evita que el dominio dependa de proveedores externos que podrían cambiar en el futuro.
* **API Unificada:** Proporciona una interfaz única donde el desarrollador no tiene que preocuparse de donde viene el recurso, siendo abstracto.
* **Optimización del Event Loop:** Al centralizar la resolución de medios, el servicio gestiona las promesas y llamadas asíncronas de forma agrupada, liberando carga al Event Loop de Node.js.

> [!IMPORTANT]
> **Filosofía de Diseño:** Consumir media debe ser una operación de "caja negra". El desarrollador entrega un ID y recibe un objeto listo para pintar en pantalla, sin conocer la complejidad técnica que ocurre detrás.

---

## 🏛️ Arquitectura Interna y Mecanismos de Eficiencia

El Servicio opera bajo una arquitectura de **Contratos de Comportamiento**. En lugar de acoplarse a clases específicas, utiliza interfaces situadas en `src/core/domain/abstractions`. Cualquier objeto que implemente estos contratos puede ser "procesado" por el Servicio.


### 🔄 El Ciclo de Vida del Enriquecimiento

1.  **Harvesting (Fase de Recolección):**
    El `MediaEnrichmentService` realiza una inspección profunda (Introspection) del objeto. Si el objeto implementa `IHasMediaAssets`, el servicio extrae todos los UUIDs. Esto permite que, incluso en objetos anidados (como un Kahoot con múltiples preguntas), se obtengan todos los requerimientos de una sola vez.

2.  **Resolution (Proxy y y FlyWeight):**
    Aquí entra en juego el **AssetResolutionProxy**. En lugar de disparar 20 peticiones HTTP, el Proxy agrupa los IDs únicos.
    * **Mecanismo Flyweight:** Si varios elementos comparten la misma imagen de portada, el Proxy solo la resuelve una vez y clona la referencia de la URL, ahorrando memoria RAM de forma masiva.
    * **Caché Transparente:** Implementa una capa de persistencia volátil que evita re-consultar bases de datos para recursos estáticos frecuentes.

3.  **Injection (Pipeline de Handlers):**
    Utilizamos una **Cadena de Responsabilidad (Chain of Responsibility)** para que el proceso sea modular.
    * **ThemeHandler:** Resuelve colores, tipografías y estilos del tema.
    * **AssetHandler:** Inyecta las URLs finales de Cloudinary en los campos correspondientes.
    * **ValidationHandler:** Asegura que los recursos resueltos sean válidos y seguros para el cliente.

### 🛠️ Patrones de Diseño 

| Patrón | Implementación Técnica | Beneficio de Ingeniería |
| :--- | :--- | :--- |
| **FACADE** | `MediaEnrichmentService` | Reduce la carga cognitiva del desarrollador al exponer un solo método `enrich()`. En caso de transoframaciones mas complejas podria requerer methods especificos |
| **FACTORY** | `EnrichmentHandlerFactory` | Encapsula el uso de la palabra reservada `new` en la facade. |
| **PROXY** | `AssetResolutionProxy` | Control de acceso y optimización de red (Batching). |
| **FLYWEIGHT** | Gestión de Instancias de URL | Minimiza el impacto en el Garbage Collector al reutilizar strings y objetos de configuración. |
| **CHAIN OF RESP.** | `EnrichmentHandlers` | Permite añadir lógica de procesamiento (ej. marcas de agua) sin tocar el código existente. |

---

## 🚀 Guía de Ingeniería para el Desarrollador

### 1. Integración en la Capa de Aplicación
El uso del MediaEnrichmentService es obligatorio antes de que cualquier dato salga de la API. Esto garantiza que el Frontend nunca reciba un ID interno de base de datos donde debería ir una imagen.

```typescript
// Ejemplo en un Handler
export class AnyHandler (Puede ser Query o Command) {
  async execute(query: queryParameterObject) {
    Persistencia: Obtenemos el Dato
    const snapshot = await this.repository.findById(query.id);
    // 2. Servicio: Transformación masiva y enriquecimiento
    // El Servicio maneja internamente la recursividad y la optimización de red
    return await this.mediaService.enrichKahoot(snapshot);
  }
}
```

---

## 🏛️ Principios SOLID

El **MediaEnrichmentService`** no es solo una utilidad, es un manifiesto de arquitectura limpia. Se han aplicado los principios **SOLID** para garantizar que el sistema sea inmune a la degradación de código a medida que el proyecto crece.

* **SRP (Single Responsibility Principle):** Cada `EnrichmentHandler` tiene una única razón para cambiar. El `AssetHandler` solo conoce la lógica de URLs, mientras que el `ThemeHandler` se especializa en estilos visuales. El servicio no es un monolito GOD Class, sino una suma de especialistas coordinados.
* **OCP (Open/Closed Principle):** El sistema está **abierto a la extensión pero cerrado a la modificación**. La lógica central del servicio nunca se toca; para añadir capacidades, simplemente se inyectan nuevos eslabones a la cadena. No bostante ver máas abajo el trade-offs.
* **LSP (Liskov Substitution Principle):** Todos los Handlers heredan de una base abstracta. El motor de orquestación trata a cualquier `VideoHandler` o `ImageHandler` como un `BaseHandler` genérico, garantizando la sustituibilidad total sin romper el flujo de ejecución.
* **ISP (Interface Segregation Principle):** En lugar de una interfaz "Gorda" de Media, fragmentamos los contratos en interfaces pequeñas: `IHasMediaAssets`, `IHasTheme` o `IHasVideo`. Los objetos de dominio solo implementan lo que realmente necesitan.
* **DIP (Dependency Inversion Principle):** El Servicio depende de abstracciones, no de implementaciones. La infraestructura (Cloudinary, MongoDB) se inyecta en tiempo de ejecución, permitiendo cambiar proveedores sin alterar la lógica de negocio.

---

## 🚀 Extensibilidad y Compromisos de Diseño

### El Camino de la Extensión (Ejemplo: Streaming Video)
Añadir soporte para un nuevo tipo de medio es un proceso lineal y seguro que no afecta a los módulos existentes:
1.  **Contrato:** Se define `IHasStreamingVideo` con el método `setVideoUrl()`.
2.  **Procesador:** Se implementa `VideoEnrichmentHandler` encapsulando la lógica del proveedor (ej. Mux o YouTube).
3.  **Registro:** Se añade al pipeline en la Factoría. Las imágenes y temas siguen funcionando sin enterarse del cambio.

### ⚖️ El Sacrificio Arquitectónico (Design Trade-offs)
En ingeniería, toda solución tiene un costo. Para lograr un **OCP** perfecto y una experiencia de desarrollo (DX) superior, hemos aceptado deliberadamente dos sacrificios:

* **Complejidad en la Facade:** La `MediaEnrichmentService` asume la responsabilidad de orquestar múltiples sub-servicios. Es el "punto caliente" de configuración, pero es el precio a pagar para que el resto de la aplicación disfrute de una simplicidad total (una sola línea de código para enriquecer).
* **Verbocidad en la Factory:** La `EnrichmentHandlerFactory` introduce un nivel adicional de indirección y código repetitivo (*boilerplate*). Sin embargo, este es el sacrificio necesario para desacoplar la **creación** de la **ejecución**, permitiendo que el sistema sea testeable y escalable.

---

## ⚡ Optimización para el Motor V8 (Node.js)

El Media Module ha sido diseñado mecánicamente para ser "amigable" con el compilador JIT de V8, maximizando el rendimiento en entornos de alta concurrencia:

* **Monomorfismo de Retorno:** Los handlers devuelven estructuras de datos con formas (*shapes*) consistentes. Esto permite que V8 optimice las **Hidden Classes** de los objetos, evitando la desoptimización del código en el "Hot Path".
* **Short-Circuiting:** Si un objeto no requiere enriquecimiento, el servicio aplica un cortocircuito inmediato. Esto evita la creación de micro-tareas y promesas innecesarias, manteniendo el **Throughput** del servidor al máximo y optimizando el uso del Event Loop.

> [!NOTE]
> El MediaEnrichmentService transforma una tarea que normalmente causaría un Dont Dry/BoilerPlate masivo en una operación de una sola línea. 

---
### 📌 DIAGRAMA DE SECUENCIA (MediaEnrichmentService)
 
> El siguiente diagrama describe el flujo reducido del servicio de enriquecimiento de media

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'background': '#ffffff',
    'mainBkg': '#ffffff',
    'primaryColor': '#e1f5fe',
    'secondaryColor': '#f1f8e9',
    'signalColor': '#009900',
    'signalTextColor': '#000000',
    'actorTextColor': '#000000',
    'noteTextColor': '#000000',
    'actorLineColor': '#009900',
    'labelBoxBorderColor': '#000000',
    'actorBorder': '#000000',
    'fontSize': '16px',
    'fontFamily': 'Segoe UI'
  }
} }%%

sequenceDiagram
    autonumber
    
    participant UC as AnyUseCase
    participant Facade as MediaEnrichmentService
    participant Entity as "TargetObject<T><br>(IHasMediaAssets)"

    rect rgb(255, 255, 255)
        Note over UC, Entity: FLUJO DE ENRIQUECIMIENTO (MediaEnrichmentService)
        
        UC->>Facade: enrich(target)
        activate Facade

        Note over Facade, Entity: 1. Protocolo de Extracción (Harvesting)
        Facade->>Entity: getMediaAssetIds()
        activate Entity
        Entity-->>Facade: Returns [ "uuid-1", "uuid-2" ]
        deactivate Entity

        Note over Facade, Entity: 2. Resolución Masiva (Proxy/Batch)
        Facade->>Facade: Resolve URLs (Batch & Cache)

        Note over Facade, Entity: 3. Protocolo de Inyección (Enrichment)
        Facade->>Entity: applyMediaUrls( {uuid: url} )
        activate Entity
        Entity-->>Facade: void
        deactivate Entity

        Facade-->>UC: target (Enriched Object)
        deactivate Facade 
    end
```
---
> El siguiente diagrama describe el flujo completo de ejecución, del servicio).
---
```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'background': '#ffffff',
    'mainBkg': '#ffffff',
    'primaryColor': '#e1f5fe',
    'secondaryColor': '#f1f8e9',
    'signalColor': '#009900',
    'signalTextColor': '#000000',
    'actorTextColor': '#000000',
    'noteTextColor': '#000000',
    'actorLineColor': '#009900',
    'labelBoxBorderColor': '#000000',
    'actorBorder': '#000000',
    'fontSize': '15px',
    'fontFamily': 'Segoe UI'
  }
} }%%

sequenceDiagram
    autonumber
    
    participant Handler as GetKahootByIdHandler
    participant Facade as MediaEnrichmentService
    participant Factory as EnrichmentHandlerFactory
    participant Chain as Handlers (Chain)
    participant Repo as KahootRepository
    participant ImgProxy as AssetResolutionProxy
    participant ThemeProxy as ThemeResolutionProxy
    participant Snapshot as KahootStylingSnapshot

    rect rgb(255, 255, 255)
        Note over Handler, Snapshot: FLUJO DETALLADO: MediaEnrichmentService
        
        Handler->>Repo: 1. findById(id)
        activate Repo
        Repo-->>Handler: Return Snapshot (IDs)
        deactivate Repo

        Handler->>Facade: 2. enrichKahoot(snapshot)
        activate Facade

        Note over Facade, Snapshot: FASE 1: RECOLECCIÓN (IHasMediaAssets)
        Facade->>Snapshot: getMediaAssetIds()
        activate Snapshot
        Snapshot-->>Facade: Returns [UUIDs]
        deactivate Snapshot

        Note over Facade, ImgProxy: FASE 2: RESOLUCIÓN BATCH
        Facade->>ImgProxy: resolveUrlsBatch(ids)
        activate ImgProxy
        ImgProxy-->>Facade: Returns Map(UUID -> URL)
        deactivate ImgProxy

        Facade->>Factory: FASE 3: createChain(urlMap)
        activate Factory
        Factory-->>Facade: Chain(Theme -> Asset)
        deactivate Factory

        Facade->>Chain: FASE 4: handle(snapshot)
        activate Chain

        Note over Chain, ThemeProxy: Lógica de Temas (IThemeable)
        opt themeId exists
            Chain->>ThemeProxy: getTheme(themeId)
            activate ThemeProxy
            ThemeProxy-->>Chain: Full Theme Object
            deactivate ThemeProxy
            Chain->>Snapshot: setInternalTheme(Theme)
        end

        Note over Chain, Snapshot: Lógica de Assets (IHasMediaAssets)
        Chain->>Snapshot: applyMediaUrls(urlMap)
        activate Snapshot
        Snapshot-->>Chain: void
        deactivate Snapshot

        Chain-->>Facade: Enriched Snapshot
        deactivate Chain

        Facade-->>Handler: Enriched Data Ready
        deactivate Facade
    end
```
---
### 🔗 RECURSOS EXTERNOS PARA EL FLUJO DEL SERVICIO DE ENRIQUECIMIENTO DE MEDIA
Para una experiencia visual mejorada y acceso a la edición del diagrama, utiliza el siguiente enlace:

> 🎨 **[Acceder al Diagrama en Eraser.io](https://app.eraser.io/workspace/fRfrRr2cxxbeY7vfT7CT?origin=share)**
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

### 🔗 Documentación de Referencia
> [!IMPORTANT]
> **Especificación de API Endpoints**
> Para profundizar en los endpoints, requests y response de la app:
>
> 📂 **Acceso al Documento:** [Especificación de API](https://docs.google.com/document/d/1wopz-IhqVTCTEU9TGHClAUCmHJ8dOp4M2ZBwvzwADrQ/edit?usp=sharing)

---


---
## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Gustavo Kufatty, Luis Monroy, Luis Ochoa, Franklin Quintana, Sergio Rodríguez, Santiago Silva.
