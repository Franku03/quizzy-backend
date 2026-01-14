/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\services\kahoot-query-authorization.service.ts

/*// src/kahoots/application/services/query-validation.service.ts
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
}/*/
