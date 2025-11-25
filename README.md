<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>



## Configuración del Proyecto 🛠️

```bash
$ yarn install
```

## Compilar y ejecutar el proyecto en modo desarrollador 🧠

Sigue estos pasos para levantar y ejecutar el proyecto localmente en modo desarrollador:

### 1. ⚙️ Levantar el Contenedor de Docker con la Base de Datos (Opcional + Recomendado)

Si necesitas una base de datos local, puedes levantar los contenedores de Docker.

- PostgreSQL:

```bash
$ docker compose -f docker-compose.dev.postgres.yaml up -d
```

- MongoDB:

```bash
$ docker compose -f docker-compose.dev.mongo.yaml up -d
```

### 2. 📝 Configurar Variables de Entorno

Debes configurar las variables de conexión a la base de datos que hayas elegido.

1. Crea una copia del archivo .env.template y renómbralo a .env.

2. Configura las variables dentro del archivo .env para establecer la conexión con la base de datos elegida (Postgres o Mongo).

### 3. ▶️ Ejecutar el Proyecto

Ejecuta el proyecto en modo de desarrollo. Este modo se recargará automáticamente al detectar cambios (conocido como watch mode).

```bash
$ yarn start:dev
```

## Compilar y ejecutar el proyecto 💽

```bash
# development
$ yarn run start

# production mode
$ yarn start:prod
```

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
