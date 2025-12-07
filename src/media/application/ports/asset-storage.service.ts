// src/media/application/ports/asset-storage.service.interface.ts
import { Either } from 'src/core/types/either';
import { StorageProviderError } from '../errors'; 

export interface IAssetStorageService {
  upload(
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
    publicId: string
  ): Promise<Either<StorageProviderError, {
    publicId: string;
    provider: string;
  }>>;
  
  delete(
    publicId: string,
    provider: string
  ): Promise<Either<StorageProviderError, void>>;
}