// src/media/application/ports/asset-metadata.dao.ts
import { Either, ErrorData } from 'src/core/types';
import { AssetMetadataRecord } from './asset-metadata-record.interface';

export interface IAssetMetadataDao {
  // Commands (siempre ejecutan o fallan)
  insert(record: AssetMetadataRecord): Promise<Either<ErrorData, void>>;
  incrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>>;
  decrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>>;
  deleteByPublicId(publicId: string): Promise<Either<ErrorData, void>>;
  
  // Queries que pueden no encontrar (búsquedas)
  findByPublicId(publicId: string): Promise<Either<ErrorData, AssetMetadataRecord | null>>;
  findByContentHash(contentHash: string): Promise<Either<ErrorData, AssetMetadataRecord | null>>;
  
  // Query que siempre retorna array (vacío o con elementos)
  findByIds(publicIds: string[]): Promise<Either<ErrorData, AssetMetadataRecord[]>>;
}