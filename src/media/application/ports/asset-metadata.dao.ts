// src/media/application/ports/asset-metadata.dao.ts
import { OptionalRepositoryResult, RepositoryResult } from 'src/core/types/repository-result.type';
import { AssetMetadataRecord } from './asset-metadata-record.interface';

export interface IAssetMetadataDao {
  insert(record: AssetMetadataRecord): Promise<RepositoryResult<void>>;
  findByPublicId(publicId: string): Promise<OptionalRepositoryResult<AssetMetadataRecord>>;
  findByContentHash(contentHash: string): Promise<OptionalRepositoryResult<AssetMetadataRecord>>;
  findByIds(publicIds: string[]): Promise<RepositoryResult<AssetMetadataRecord[]>>;
  incrementReferenceCount(publicId: string): Promise<RepositoryResult<void>>;
  decrementReferenceCount(publicId: string): Promise<RepositoryResult<void>>;
  deleteByPublicId(publicId: string): Promise<RepositoryResult<void>>;
}