// src/media/application/ports/asset-storage.service.interface.ts
import { Either, ErrorData } from 'src/core/types'; 

export interface IAssetStorageService {
    upload(
        fileBuffer: Buffer,
        mimeType: string,
        originalName: string,
        publicId: string
    ): Promise<Either<ErrorData, { 
        publicId: string;
        provider: string;
    }>>;
    
    delete(
        publicId: string,
        provider: string
    ): Promise<Either<ErrorData, void>>;
}