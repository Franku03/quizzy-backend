/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\ports\i-asset-metadata.dao.interface.ts

import { Either, ErrorData } from 'src/core/types';
import { AssetMetadataRecord } from './i-asset-metadata-record.interface';

export interface IAssetMetadataDao {
  // Commands (siempre ejecutan o fallan)
  insert(record: AssetMetadataRecord): Promise<Either<ErrorData, void>>;
  incrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>>;
  decrementReferenceCount(publicId: string): Promise<Either<ErrorData, void>>;
  deleteByPublicId(publicId: string): Promise<Either<ErrorData, void>>;

  // Queries que pueden no encontrar (búsquedas)
  findByPublicId(
    publicId: string,
  ): Promise<Either<ErrorData, AssetMetadataRecord | null>>;
  findByContentHash(
    contentHash: string,
  ): Promise<Either<ErrorData, AssetMetadataRecord | null>>;

  findByAssetId(
    id: string,
  ): Promise<Either<ErrorData, AssetMetadataRecord | null>>;

  // Query que siempre retorna array (vacío o con elementos)
  findByIds(
    publicIds: string[],
  ): Promise<Either<ErrorData, AssetMetadataRecord[]>>;

  findThemeById(
    assetId: string,
  ): Promise<Either<ErrorData, AssetMetadataRecord | null>>;

  //Tengo q ver bien como va a ser la request pero por si acaso blindo esto XD
  findThemes(options?: {
    category?: string; // Filtrar por categoría (ej: 'image', 'video')
    format?: string; // Filtrar por formato (ej: 'png', 'jpg')
    mimeType?: string; // Filtrar por MIME type específico
    limit?: number; // Límite de resultados
    offset?: number; // Paginación
    sortBy?: 'uploadedAt' | 'size' | 'originalName'; // Campo para ordenar
    sortOrder?: 'asc' | 'desc'; // Dirección del orden
  }): Promise<Either<ErrorData, AssetMetadataRecord[]>>;
}
