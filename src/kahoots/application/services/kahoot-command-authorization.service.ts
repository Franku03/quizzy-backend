// src/kahoots/application/services/kahoot-authorization.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Either, ErrorData } from 'src/core/types';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { IKahootValidator } from '../ports/i-kahoot-validator.interface';
import type { IKahootRepository } from '../../domain/ports/IKahootRepository';
import { Kahoot } from '../../domain/aggregates/kahoot';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@Injectable()
export class KahootAuthorizationService implements IKahootValidator<Kahoot> {
  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository
  ) { }

  async validateAccess(
    kahootId: string,
    userId: string,
    operation: 'read' | 'update' | 'delete'
  ): Promise<Either<ErrorData, Kahoot>> {
    const errorContext = createDomainContext('Kahoot', operation, {
      domainObjectId: kahootId,
      actorId: userId,
      userId,
      intendedAction: operation,
    });

    // Buscar kahoot
    const findResult = await this.kahootRepository.findKahootByIdEither(kahootId);

    if (findResult.isLeft()) {
      return Either.makeLeft(findResult.getLeft());
    }

    const kahootOrNull = findResult.getRight();
    if (kahootOrNull === null) {
      return Either.makeLeft(DomainErrorFactory.notFound(errorContext));
    }

    // Lógica diferente según operation
    switch (operation) {
      case 'update':
      case 'delete':
        // Solo el dueño puede update/delete
        if (kahootOrNull.authorId !== userId) {
          return Either.makeLeft(DomainErrorFactory.unauthorized(errorContext));
        }
        break;
      
      case 'read':
        const isPublic = kahootOrNull.visibility.value === 'PUBLIC';
        const isOwner = kahootOrNull.authorId === userId;
        
        if (!isPublic && !isOwner) {
          return Either.makeLeft(DomainErrorFactory.unauthorized(errorContext));
        }
        break;
    }

    return Either.makeRight(kahootOrNull);
  }
}