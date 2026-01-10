/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\ports\i-asset-metadata-record.interface.ts

export interface AssetMetadataRecord {
  // IDs
  assetId: string;               // UUID generado en handler
  publicId: string;              // ID en storage (ej: "uploads/uuid-here")
  
  // Storage
  provider: string;              // 'cloudinary', 's3', 'local'
  
  // Archivo (del UploadAssetCommand)
  originalName: string;          // Nombre original del archivo
  mimeType: string;              // Tipo MIME (image/jpeg, etc.)
  size: number;                  // Tamaño en bytes
  
  // Deduplicación
  contentHash: string;           // SHA-256 del buffer
  
  // Referencias
  referenceCount: number;        // Cuántas entidades usan este asset
  
  // Metadata calculada
  format: string;                // 'jpg', 'png', 'pdf' (del mimeType)
  category: string;              // 'image', 'video', 'document' (del mimeType)
  theme?: boolean; 
  // Temporal
  uploadedAt: Date;              // Cuándo se subió por primera vez
}