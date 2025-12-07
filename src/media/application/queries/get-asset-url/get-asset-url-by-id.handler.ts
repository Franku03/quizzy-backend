/*// src/media/application/queries/get-asset-url-by-id/get-asset-url-by-id.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAssetUrlByIdQuery } from './get-asset-url-by-id.query';
import type { IAssetMetadataDao } from '../../ports/asset-metadata.dao';
import type { IUrlGenerator } from '../../ports/asset-url-generator.interface';
import { Either } from 'src/core/types/either';
import { Optional } from 'src/core/types/optional';
import { AssetMetadataRecord } from '../../ports/asset-metadata-record.interface';
import { MediaErrorFactory } from '../../errors/media-error.factory';
import { GetAssetUrlError } from '../../errors/media-aplication.errors';

export type GetAssetUrlByIdResult = {
  url: string;
  metadata: AssetMetadataRecord;
  expiresAt?: Date;
};

@QueryHandler(GetAssetUrlByIdQuery)
export class GetAssetUrlByIdHandler 
  implements IQueryHandler<GetAssetUrlByIdQuery, Either<GetAssetUrlError, GetAssetUrlByIdResult>> {
  
  constructor(
    @Inject('IAssetMetadataDao')
    private readonly metadataDao: IAssetMetadataDao,
    @Inject('IUrlGenerator')
    private readonly urlGenerator: IUrlGenerator,
  ) {}

  async execute(query: GetAssetUrlByIdQuery): Promise<Either<GetAssetUrlError, GetAssetUrlByIdResult>> {
    const { publicId, options } = query;

    if (!publicId || publicId.trim() === '') {
      return Either.makeLeft(MediaErrorFactory.invalidAssetId(publicId));
    }

    try {
      // 1. Buscar metadatos usando DAO
      const metadataResult = await this.metadataDao.findByPublicId(publicId);
      
      // 2. Manejar error del DAO (RepositoryError)
      if (metadataResult.isLeft()) {
        const repoError = metadataResult.getLeft();
        return Either.makeLeft(
          MediaErrorFactory.databaseError(
            'Error al buscar metadatos', 
            repoError.message
          )
        );
      }

      // 3. Verificar si existe
      const metadataOptional: Optional<AssetMetadataRecord> = metadataResult.getRight();
      if (!metadataOptional.hasValue()) {
        return Either.makeLeft(MediaErrorFactory.assetNotFound(publicId));
      }

      const metadata = metadataOptional.getValue();
      
      // 4. Validar datos del asset
      if (!metadata.storageKey) {
        return Either.makeLeft(MediaErrorFactory.invalidAssetReference(publicId));
      }

      // 5. Generar URL usando el generador de URLs
      const url = this.urlGenerator.generateUrl(metadata.storageKey, {
        signed: options?.signed,
        expiresIn: options?.expiresIn,
        transformations: options?.transformations,
      });

      // 6. Preparar resultado
      const result: GetAssetUrlByIdResult = {
        url,
        metadata,
      };

      // 7. Añadir expiración si aplica
      if (options?.expiresIn) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + options.expiresIn);
        result.expiresAt = expiresAt;
      }

      return Either.makeRight(result);

    } catch (error) {
      // Capturar cualquier error inesperado del generador de URLs
      return Either.makeLeft(
        MediaErrorFactory.unexpectedError(
          `Error al generar URL para ${publicId}`, 
          error
        )
      );
    }
  }
}*/