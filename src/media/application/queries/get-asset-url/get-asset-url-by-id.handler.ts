// src/multimedia/application/queries/get-asset-url.query-handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAssetUrlQuery } from './get-asset-url-by-id.query';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { IFileMetadataRepository } from 'src/core/application/repository/i-file-metadata.repository';
import type { IAssetStorageService } from 'src/media/application/ports/asset-storage/i-asset-storage.service';
import { DatabaseError } from 'src/database/infrastructure/errors';
import { Either } from 'src/core/types/either';

// Errores específicos para este caso de uso
export type GetAssetUrlError =
  | DatabaseError
  | {
    type: 'AssetNotFound';
    message: string;
    assetId: string;
    timestamp: Date;
  }
  | {
    type: 'InvalidAssetReference';
    message: string;
    assetId: string;
    timestamp: Date;
  };

@QueryHandler(GetAssetUrlQuery)
export class GetAssetUrlQueryHandler
  implements IQueryHandler<GetAssetUrlQuery, Either<GetAssetUrlError, string>> {
  constructor(
    @Inject(RepositoryName.FileMetadata)
    private readonly metadataRepository: IFileMetadataRepository,
    @Inject('IAssetStorageService')
    private readonly assetStorageService: IAssetStorageService,
  ) { }

  async execute(query: GetAssetUrlQuery): Promise<Either<GetAssetUrlError, string>> {
    const { publicId } = query;

    // 1. Buscar metadatos (puede fallar con DatabaseError)
    const metadataResult = await this.metadataRepository.findByPublicId(publicId);

    if (metadataResult.isLeft()) {
      return Either.makeLeft(metadataResult.getLeft());
    }

    // 2. Si no existe ERROR - ahora es Optional
    const metadataOptional = metadataResult.getRight();
    if (!metadataOptional.hasValue()) {
      return Either.makeLeft({
        type: 'AssetNotFound',
        message: `El asset con ID ${publicId} no existe`,
        assetId: publicId,
        timestamp: new Date(),
      });
    }

    // 3. Si referencia inválida ERROR (datos corruptos)
    const metadata = metadataOptional.getValue();
    const storageReferenceId = metadata.contentHash;
    if (!storageReferenceId) {
      return Either.makeLeft({
        type: 'InvalidAssetReference',
        message: `El asset ${publicId} tiene una referencia de almacenamiento inválida`,
        assetId: publicId,
        timestamp: new Date(),
      });
    }

    // 4. Generar URL (operación local que no debería fallar)
    const url = this.assetStorageService.generateUrl(storageReferenceId);
    return Either.makeRight(url);
  }
}