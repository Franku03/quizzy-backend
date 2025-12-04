// src/multimedia/application/queries/get-asset-url.query-handler.ts

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAssetUrlQuery } from './get-asset-url-by-id.query';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { IFileMetadataRepository } from 'src/core/application/repository/i-file-metadata.repository';
import type { IAssetStorageService } from 'src/media/application/ports/asset-storage/i-asset-storage.service';

@QueryHandler(GetAssetUrlQuery)
export class GetAssetUrlQueryHandler
  implements IQueryHandler<GetAssetUrlQuery, string | null> 
{
  constructor(
    @Inject(RepositoryName.FileMetadata)
    private readonly metadataRepository: IFileMetadataRepository,
    @Inject('IAssetStorageService')
    private readonly assetStorageService: IAssetStorageService,
  ) {}

  async execute(query: GetAssetUrlQuery): Promise<string | null> {
    const { publicId } = query;

    const metadataOptional = await this.metadataRepository.findByPublicId(publicId);

    if (!metadataOptional.hasValue()) { 
        console.warn(`[GetAssetUrlQuery] Metadato no encontrado para PublicId: ${publicId}`);
        return null;
    }
    
    const metadata = metadataOptional.getValue(); 

    const storageReferenceId = metadata.contentHash; 

    if (!storageReferenceId) {
        console.error(`[GetAssetUrlQuery] Referencia de almacenamiento vacia para PublicId: ${publicId}`);
        return null; 
    }
    return this.assetStorageService.generateUrl(storageReferenceId);
  }
}