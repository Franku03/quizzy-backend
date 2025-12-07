// src/media/application/ports/asset-metadata-record.interface.ts
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
  
  // Temporal
  uploadedAt: Date;              // Cuándo se subió por primera vez
}