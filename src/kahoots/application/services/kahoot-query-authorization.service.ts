// src/kahoots/application/services/query-validation.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, ErrorData } from 'src/core/types';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { IKahootValidator } from '../ports/i-kahoot-validator.interface';
import type { IKahootDao } from '../ports/kahoot.dao.port';
import { KahootHandlerResponse } from '../response/kahoot.handler.response';

@Injectable()
export class QueryValidationService implements IKahootValidator<KahootHandlerResponse> {
  constructor(
    @Inject('IKahootDao')
    private readonly kahootDao: IKahootDao
  ) {}

  async validateAccess(
    kahootId: string,
    userId: string,
    operation: 'read' | 'update' | 'delete'
  ): Promise<Either<ErrorData, KahootHandlerResponse>> {
    // Solo manejamos 'read' para queries
    if (operation !== 'read') {
      throw new Error('QueryValidationService solo soporta operación "read"');
    }

    const errorContext = createDomainContext('Kahoot', 'read', {
      domainObjectId: kahootId,
      actorId: userId,
      userId,
      intendedAction: 'read',
    });

    // Obtener del DAO
    const result = await this.kahootDao.getKahootById(kahootId);

    if (result.isLeft()) {
      return Either.makeLeft(result.getLeft());
    }

    const kahootResponse = result.getRight();
    if (!kahootResponse) {
      return Either.makeLeft(DomainErrorFactory.notFound(errorContext));
    }

    // Validar acceso para read
    const isPublic = kahootResponse.visibility === 'PUBLIC';
    const isOwner = kahootResponse.authorId === userId;

    if (!isPublic && !isOwner) {
      return Either.makeLeft(DomainErrorFactory.unauthorized(errorContext));
    }

    return Either.makeRight(kahootResponse);
  }
}