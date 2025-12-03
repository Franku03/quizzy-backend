// El query handler recibe el query y devuelve un readModel. Este ultimo
// lo recibe de la implementacion del DAO que utilice para hacer la consulta
// en la base de datos. Recuerden que el DAO se encuentra en el modulo database.

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IKahootDao } from '../ports/kahoot.dao.port';
import { GetKahootByIdQuery } from './get-kahoot-by-id.query';
import { Optional } from '../../../../core/types/optional';
import { Inject } from '@nestjs/common';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { KahootReadModel } from '../read-model/kahoot.response.read.model';


@QueryHandler(GetKahootByIdQuery)
export class GetKahootByIdHandler implements IQueryHandler<GetKahootByIdQuery> {
  constructor(@Inject(DaoName.Kahoot) private readonly userQueryDao: IKahootDao) {}

  async execute(query: GetKahootByIdQuery): Promise<Optional<KahootReadModel>> {

    return await this.userQueryDao.getKahootById(query.kahootId);
  }
}
