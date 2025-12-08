// src/media/application/read-model/asset-metadata.read-model.ts
export interface AssetMetadataReadModel {
  assetId: string;
  publicId: string;
  mimeType: string;
  size: number;
  format: string;
  category: string;
  url: string;
  isImage: boolean;
  isVideo: boolean;
  isDocument: boolean;
}