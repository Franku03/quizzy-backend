// File: src/backoffice/infrastructure/services/verify-if-user-is-admin.mongo.service.ts
/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\infrastructure\nestjs\domain-services\verify-if-user-is-admin.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { Either, ErrorData } from 'src/core/types';
import { IVerifyIfUserIsAdminService } from 'src/backoffice/domain/domain-services/verify-if-user-is-admin.service.interface';
import type { IBackofficeDao } from 'src/backoffice/application/queries/ports/backoffice.dao.port';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

@Injectable()
export class VerifyIfUserIsAdminService implements IVerifyIfUserIsAdminService {
  constructor(
    @Inject(DaoName.Backoffice)
    private readonly backofficeDao: IBackofficeDao,
  ) {}

  async execute(userId: UserId): Promise<Either<ErrorData, boolean>> {
    // Usar el DAO para verificar si el usuario es admin
    return await this.backofficeDao.verifyIfUserIsAdmin(userId.value);
  }
}
