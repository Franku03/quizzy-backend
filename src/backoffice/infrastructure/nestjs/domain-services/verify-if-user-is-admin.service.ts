// File: src/backoffice/infrastructure/services/verify-if-user-is-admin.mongo.service.ts
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
