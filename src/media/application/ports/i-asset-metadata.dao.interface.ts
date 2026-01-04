// src/media/application/ports/asset-metadata.dao.ts
import { Either, ErrorData } from 'src/core/types';
import { AssetMetadataRecord } from './i-asset-metadata-record.interface';

export interface IAssetMetadataDao {
  // Commands (siempre ejecutan o fallan)
  insert(record: AssetMetadataRecord): Promise<Either<ErrorData, void>>;
  incrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>>;
  decrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>>;
  deleteByPublicId(publicId: string): Promise<Either<ErrorData, void>>;
  
  // Queries que pueden no encontrar (búsquedas)
  findByPublicId(publicId: string): Promise<Either<ErrorData, AssetMetadataRecord | null>>;
  findByContentHash(contentHash: string): Promise<Either<ErrorData, AssetMetadataRecord | null>>;

  findByAssetId(id: string): Promise<Either<ErrorData, AssetMetadataRecord | null>>;
  
  // Query que siempre retorna array (vacío o con elementos)
  findByIds(publicIds: string[]): Promise<Either<ErrorData, AssetMetadataRecord[]>>;

  findThemeById(assetId: string): Promise<Either<ErrorData, AssetMetadataRecord | null>>;

  //Tengo q ver bien como va a ser la request pero por si acaso blindo esto XD
  findThemes(options?: {
    category?: string;          // Filtrar por categoría (ej: 'image', 'video')
    format?: string;            // Filtrar por formato (ej: 'png', 'jpg')
    mimeType?: string;          // Filtrar por MIME type específico
    limit?: number;             // Límite de resultados
    offset?: number;            // Paginación
    sortBy?: 'uploadedAt' | 'size' | 'originalName'; // Campo para ordenar
    sortOrder?: 'asc' | 'desc'; // Dirección del orden
  }): Promise<Either<ErrorData, AssetMetadataRecord[]>>;

}