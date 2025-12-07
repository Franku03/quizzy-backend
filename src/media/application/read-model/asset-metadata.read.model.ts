// src/media/application/read-model/asset-metadata.read-model.ts
export interface AssetMetadataReadModel {
  assetId: string;
  publicId: string;
  provider: string;
  originalName: string;
  mimeType: string;
  size: number;
  contentHash: string;
  referenceCount: number;
  format: string;
  category: string;
  uploadedAt: Date;
  url: string;
  isImage: boolean;
  isVideo: boolean;
  isDocument: boolean;
}