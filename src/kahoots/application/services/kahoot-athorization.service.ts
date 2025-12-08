// src/kahoots/application/services/kahoot-authorization.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Either, ErrorData } from 'src/core/types';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import type { IKahootRepository } from '../../domain/ports/IKahootRepository';
import { Kahoot } from '../../domain/aggregates/kahoot';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@Injectable()
export class KahootAuthorizationService {
  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository
  ) { }

  private async validateOwnership(
    kahootId: string,
    requestingUserId: string,
    operation: 'update' | 'delete'
  ): Promise<Either<ErrorData, Kahoot>> {
    // Contexto base para errores
    const errorContext = createDomainContext('Kahoot', operation, {
      domainObjectId: kahootId,
      actorId: requestingUserId,
      userId: requestingUserId,
      intendedAction: operation,
    });

    // 1. Buscar kahoot
    const findResult = await this.kahootRepository.findKahootByIdEither(kahootId);

    // 2. Manejar error de infraestructura
    if (findResult.isLeft()) {
      return Either.makeLeft(findResult.getLeft());
    }

    // 3. Manejar "No encontrado"
    const kahootOrNull = findResult.getRight();
    if (kahootOrNull === null) {
      return Either.makeLeft(DomainErrorFactory.notFound(errorContext));
    }

    // 4. Validar propiedad (regla de negocio)
    if (kahootOrNull.authorId !== requestingUserId) {
      return Either.makeLeft(
        DomainErrorFactory.unauthorized(errorContext)
      );
    }

    return Either.makeRight(kahootOrNull);
  }

  public async getKahootForUpdate(
    kahootId: string,
    requestingUserId: string
  ): Promise<Either<ErrorData, Kahoot>> {
    return this.validateOwnership(kahootId, requestingUserId, 'update');
  }

  public async getKahootForDelete(
    kahootId: string,
    requestingUserId: string
  ): Promise<Either<ErrorData, Kahoot>> {
    return this.validateOwnership(kahootId, requestingUserId, 'delete');
  }
}