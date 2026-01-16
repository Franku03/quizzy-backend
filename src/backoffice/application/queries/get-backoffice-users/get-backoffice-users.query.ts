import { OrderByEnum } from 'src/backoffice/infrastructure/nestjs/dtos/backoffice-user-pagination.dto';
import { IQuery } from 'src/core/application/cqrs';

export class GetBackofficeUsersQuery implements IQuery {
  constructor(
    public readonly name?: string, // nombre del creador
    public readonly userId?: string, // id del usuario
    public readonly limit?: number, // cantidad maxima de users por page
    public readonly page?: number, // numero de pagina
    public readonly orderBy?: `${OrderByEnum}`, // Usar template literal type
    public readonly order?: 'asc' | 'desc',
  ) {}
}
