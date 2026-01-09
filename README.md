<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>



## Configuración del Proyecto 🛠️

```bash
$ yarn install
```

## Compilar y ejecutar el proyecto en modo desarrollador 🧠

Sigue estos pasos para levantar y ejecutar el proyecto localmente en modo desarrollador:

1. **Configurar Variables de Entorno**
      Debes configurar las variables de conexión a la base de datos que hayas elegido.
      - Crea una copia del archivo `.env.template` y renómbralo a `.env`.
      - Configura las variables dentro del archivo .env para establecer la conexión con la base de datos elegida (Postgres o Mongo).
      - **‼️Importante‼️**Si tienes un cluster de BD en mongo atlas, puedes colocar la URL a la misma en la variable de entorno ``MONGO_CNN`` para conectarte a esta envés de la BD local.

2. **Levantar el Contenedor de Docker con la Base de Datos (Opcional + Recomendado)**
      Si necesitas una base de datos local, puedes levantar los contenedores de Docker. Asegurate de que `DB_HOST` y `MONGO_HOST` estén configuradas como `localhost` según si usarás postgres o mongo respectivamente.
      - PostgreSQL:
      ```bash
      $ docker compose -f docker-compose.dev.postgres.yaml up -d
      ```
      - MongoDB:
      ```bash
      $ docker compose -f docker-compose.dev.mongo.yaml up -d
      ```

3. **Ejecutar el Proyecto**
      Ejecuta el proyecto en modo de desarrollo. Este modo se recargará automáticamente al detectar cambios si lo corres en modo development (conocido como watch mode).
      ```bash
      # development
      $ yarn run start
      # production mode
      $ yarn start:prod
      ```

## 🚀 Ejecutar el Backend Localmente

Para levantar el backend en tu entorno local con Docker Compose, sigue estos pasos:

1. **Crear el archivo de entorno**  
   - Haz una copia del archivo `.env.template` y renómbrala como `.env`.  
   - En este archivo deberás configurar todas tus variables necesarias (puertos, credenciales de base de datos, Cloudinary, etc.).

2. **Elegir el motor de base de datos**  
   - Si eliges **MongoDB**, asegúrate de que en tu `.env` la variable `MONGO_HOST` esté configurada como:
     ```env
     MONGO_HOST=mongo
     ```
   - Si eliges **Postgres**, asegúrate de que en tu `.env` la variable `DB_HOST` esté configurada como:
     ```env
     DB_HOST=postgres
     ```

3. **Levantar el backend con Docker Compose**  
   Ejecuta el comando correspondiente según el motor de base de datos elegido:
   - Para **MongoDB**:
     ```bash
     docker compose -f docker-compose.local.mongo.yaml up -d
     ```
   - Para **Postgres**:
     ```bash
     docker compose -f docker-compose.local.postgres.yaml up -d
     ```

4. **Acceder a la aplicación**  
   Una vez levantados los contenedores, el backend estará disponible. Por defecto se configura como 
    - `http://localhost:3000/api` para acceder al servidor y los endpoints HTTP respectivos a cada módulo.
    - `ws://localhost:3000/multiplayer-sessions` para acceder al servidor de WebSockets


## Correr Tests 🪛

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Directorios del proyecto 📁

El backend se ha estructurado seguiendo los principios de la Arquitectura Hexagonal, cada modulo de Nest contiene internamente los siguientes directorios, de tal forma que cada módulo es su propio Hexágono fomentando la Separación de Responsabilidades a nivel de código y entre desarrolladores

Para una comprensión visual del modelo de dominio, consulta el siguiente diagrama:
👉 **[Ver Diagrama Modelo de Dominio](https://lucid.app/lucidchart/ece44902-e188-405b-98a2-99114bfce612/edit?invitationId=inv_5ebb1b27-3046-48d7-bb6f-ddbeccdac5bc&page=5WW8gG8tv4Q4#)** 👈

- 🟡 **Domain** 🟡: Contiene todo lo relacionado al core del negocio así como sus procesos, aquí se hayan todas las clases que componen el modelo de dominio.

  - ```entities```
  - ```value-objects```
  - ```aggregates```
  - ```domain-services```
  - ```repositories``` (interfaces, también conocidos como output ports)

- 🟣 **Application** 🟣: Contiene todo a la lógica de aplicación así como los puertos que implementan los adaptadores en la capa de infraestructura para comunicarse con la capa de dominio.

  - ```use-cases``` (Acción única y específica que se puede realizar, es un punto específico de interacción, también conocidos como input Ports, ejemplo: creación de kahoot)
  - ```application-services``` (poseen las reglas de negocio específicas para la capa de aplicación y coordinan/orquestran los use-cases)
  - ``` dtos ``` (Estructuras de datos expuestas públicamente que definen los contratos de entrada y salida para los Casos de Uso de la aplicación. Garantizan que la lógica de negocio central permanezca independiente de cualquier tecnología externa)

- 🔵 **Infrastructure** 🔵: Contiene todo lo relacionado a las implementaciones específicas que utilizan librerías de terceros, conexiones a servicios externos, configuraciones, y los controladores y gateways de NestJS con los cuales la API procesa las solicitudes del front. Contiene también el archivo .module de NestJS que organiza el código relavante para la feature (módulo) en cuestión.

  - ```nest-js```contiene los controladores (manejo de solicitudes HTTP), gateways (manejo de WebSockets) y decoradores custom de NestJS respectivos al módulo
  - ```external-services```(Conexiones con servicios de terceros)
  - ```repositories``` (implementación de las interfaces de los repositorios definidas en Domain)

También existen módulos compartidos entre desarrolladores, siendo estos los siguientes:

- 🟡🟣🔵 **Modulo core** 🔵🟣🟡: Inserte definición
- 🔵 **Modulo databases** 🔵 Definiciones de las entidades bajo las librerías de terceros [TypeORM, Mongoose] para trabajar con el modelo de datos y las implementaciones respectivas de cada respositorio perteneciente a los módulos de la aplicación. Permite cambiar dinámicamente de Base de datos y de un ORM a un ODM.

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Gustavo Kufatty, Luis Monroy, Luis Ochoa, Franklin Quintana, Sergio Rodríguez, Santiago Silva.