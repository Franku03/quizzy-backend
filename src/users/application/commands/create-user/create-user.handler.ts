// Esto es un commandHandler. Recibe el Command y usa
// una o varias implementaciones de nuestros ports (repositorios)
// para cargar agregados y manejar operaciones transacccionales
// Tambien pueden darle un event bus como parámetro (se debe cargar)
// como un provider de nest para que las dependencias se resuelvan
// correctamente, OJO CON ESO (y el event bus debe ser inyectable)

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { CreateUserCommand } from './create-user.command';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Inject } from '@nestjs/common';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  // Inyectamos el Puerto del Repositorio (no el DAO, el Repositorio de Agregados)
  constructor(
    @Inject(RepositoryName.User)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    // 1. Aquí debería haber lógica del dominio para crear el agregado de usuario.
    //    Por ejemplo const newUser = User.Create( ... )

    // 2. Persistencia: Usar el Repositorio para guardar el estado del Agregado (en
    //    este ejemplo no he aplicado logica del dominio). Deberian pasar el agregado
    //    al repositorio, pero yo solo voy a pasar un string
    await this.userRepository.saveUser(command.name);

    // Aquí podríamos emitir un Domain Event (e.g., UserCreatedEvent)
  }
}
