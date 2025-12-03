// El query handler recibe el query y devuelve un readModel. Este ultimo
// lo recibe de la implementacion del DAO que utilice para hacer la consulta
// en la base de datos. Recuerden que el DAO se encuentra en el modulo database.

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IUserDao } from '../ports/users.dao.port';
import { GetUserByNameQuery } from './get-user-by-name.query';
import { Optional } from '../../../../core/types/optional';
import { UserReadModel } from '../read-model/user.read.model';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

@QueryHandler(GetUserByNameQuery)
export class GetUserByNameHandler implements IQueryHandler<GetUserByNameQuery> {
  // Inyectamos un DAO/Read-Repository dedicado a la lectura
  // Esto es parte de la capa de Infraestructura, pero inyectado aquí.
  constructor(@Inject(DaoName.User) private readonly userQueryDao: IUserDao) {}

  async execute(query: GetUserByNameQuery): Promise<Optional<UserReadModel>> {
    // La lógica es directa: consultar el DAO y retornar el Read Model

    return await this.userQueryDao.getUserByName(query.userName);
  }
}
