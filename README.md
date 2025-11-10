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
$ yarn run start:dev

# production mode
$ yarn run start:prod
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

El backend se ha estructurado seguiendo los principios de la Arquitectura Hexagonal

- 🟡 **Domain** 🟡: Contiene todo lo relacionado al core del negocio así como sus procesos, aquí se hayan todas las clases que componen el modelo de dominio
  - ```entities```
  - ```value-objects```
  - ```aggregates```
  - ```domain-services```
  - ```repositories``` (interfaces, también conocidos como output ports)
- 🟣 **Application** 🟣: Contiene todo a la lógica de aplicación así como los puertos que implementan los adaptadores en la capa de infraestructura para comunicarse con la capa de dominio
  - ```use-cases``` (Acción única y específica que se puede realizar, es un punto específico de interacción, ejemplo: creación de kahoot)
  - ```application-services``` (poseen las reglas de negocio específicas para la capa de aplicación y coordinan/orquestran los use-cases)
  - ```ports``` (interfaces que definen como deben ser implementados los servicios de aplicación que los driven adapters utilizan [input ports], son necesarios para proveer una capa de acoplamiento abstracto con los adaptadores)
- 🔵 **Infrastructure** 🔵: Contiene todo lo relacionado a las implementaciones específicas que utilizan librerías de terceros, definiciones de entidades necesarias para interactuar con el modelo de datos, conexiones a servicioes externos, configuraciones, y los modulos de NestJS con los cuales la API procesa las solicitudes del front
  - ```config``` (Configuraciones generales del proyecto)
  - ```databases```(Definiciones de las entidades bajo las librerías de terceros [TypeORM, Mongoose] para trabajar con el modelo de datos)
  - ```external-services```(Conexiones con servicios de terceros)
  - ```nestjs-modules```(Modulos de NestJS correspondientes a cada épica, contienen los respectivos Modules, Controllers y Gateways)
  - ```repositories``` (implementación de las interfaces de los repositorios definidas en Domain)