<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>



## Configuración del Proyecto 🛠️

```bash
$ yarn install
```

## Compilar y ejecutar el proyecto 💽

```bash
# development
$ yarn run start

# watch mode
$ yarn start:dev

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

- 🔵 **Infrastructure** 🔵: Contiene todo lo relacionado a las implementaciones específicas que utilizan librerías de terceros, definiciones de entidades necesarias para interactuar con el modelo de datos, conexiones a servicios externos, configuraciones, y los controladores y gateways de NestJS con los cuales la API procesa las solicitudes del front. Contiene también el archivo .module de NestJS que organiza el código relavante para la feature (módulo) en cuestión.

  - ```nestJs```contiene los controladores (manejo de solicitudes HTTP), gateways (manejo de WebSockets) y decoradores custom de NestJS respectivos al módulo
  - ```databases```(Definiciones de las entidades bajo las librerías de terceros [TypeORM, Mongoose] para trabajar con el modelo de datos)
  - ```external-services```(Conexiones con servicios de terceros)
  - ```repositories``` (implementación de las interfaces de los repositorios definidas en Domain)
