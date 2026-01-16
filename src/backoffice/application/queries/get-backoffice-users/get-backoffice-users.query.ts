/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\application\queries\get-backoffice-users\get-backoffice-users.query.ts

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
