// src/kahoots/application/services/kahoot-authorization.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { IKahootRepository } from '../../domain/ports/IKahootRepository';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { Kahoot } from '../../domain/aggregates/kahoot';
import { VisibilityStatusEnum } from '../../domain/value-objects/kahoot.visibility-status';
import { KahootErrorFactory } from '../../domain/errors/kahoot-error.factory';
import { 
  KahootNotFoundError, 
  UnauthorizedKahootError 
} from '../../domain/errors/kahoot-domain.errors';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@Injectable()
export class KahootAuthorizationService {
  constructor(
    @Inject(RepositoryName.Kahoot) 
    private readonly kahootRepository: IKahootRepository
  ) {}

  /**
   * Obtiene kahoot validando permisos de lectura
   * Para consultas (queries) y visualización pública
   */
  public async getKahootForRead(
    kahootId: string,
    requestingUserId: string
  ): Promise<Either<KahootNotFoundError | UnauthorizedKahootError, Kahoot>> {
    const id = new KahootId(kahootId);
    const findResult = await this.kahootRepository.findKahootByIdEither(id);

    // Mapear resultado del repositorio a dominio
    if (findResult.isLeft()) {
      // Loggear para debugging (opcional)
      console.warn(`Repository error for kahoot ${kahootId}:`, findResult.getLeft());
      return Either.makeLeft(KahootErrorFactory.notFound(kahootId));
    }

    const kahootOptional = findResult.getRight();
    if (!kahootOptional.hasValue()) {
      return Either.makeLeft(KahootErrorFactory.notFound(kahootId));
    }

    const kahoot = kahootOptional.getValue();

    // Validar visibilidad usando enum del dominio
    const isPublic = kahoot.visibility.value === VisibilityStatusEnum.PUBLIC;
    const isOwner = kahoot.authorId === requestingUserId;

    if (!isPublic && !isOwner) {
      return Either.makeLeft(
        KahootErrorFactory.unauthorized(requestingUserId, kahootId, 'read')
      );
    }

    return Either.makeRight(kahoot);
  }

  /**
   * Obtiene kahoot validando permisos de modificación
   * Para comandos de actualización
   */
  public async getKahootForUpdate(
    kahootId: string,
    requestingUserId: string
  ): Promise<Either<KahootNotFoundError | UnauthorizedKahootError, Kahoot>> {
    return this.validateOwnership(kahootId, requestingUserId, 'update');
  }

  /**
   * Obtiene kahoot validando permisos de eliminación
   * Para comandos de eliminación
   */
  public async getKahootForDelete(
    kahootId: string,
    requestingUserId: string
  ): Promise<Either<KahootNotFoundError | UnauthorizedKahootError, Kahoot>> {
    return this.validateOwnership(kahootId, requestingUserId, 'delete');
  }

  /**
   * Método base para validar propiedad (ownership)
   */
  private async validateOwnership(
    kahootId: string,
    requestingUserId: string,
    action: 'update' | 'delete'
  ): Promise<Either<KahootNotFoundError | UnauthorizedKahootError, Kahoot>> {
    const id = new KahootId(kahootId);
    const findResult = await this.kahootRepository.findKahootByIdEither(id);

    // Mapear resultado del repositorio a dominio
    if (findResult.isLeft()) {
      // Loggear para debugging (opcional)
      console.warn(`Repository error for kahoot ${kahootId}:`, findResult.getLeft());
      return Either.makeLeft(KahootErrorFactory.notFound(kahootId));
    }

    const kahootOptional = findResult.getRight();
    if (!kahootOptional.hasValue()) {
      return Either.makeLeft(KahootErrorFactory.notFound(kahootId));
    }

    const kahoot = kahootOptional.getValue();

    // Solo el creador puede modificar o eliminar
    if (kahoot.authorId !== requestingUserId) {
      return Either.makeLeft(
        KahootErrorFactory.unauthorized(requestingUserId, kahootId, action)
      );
    }

    return Either.makeRight(kahoot);
  }
}