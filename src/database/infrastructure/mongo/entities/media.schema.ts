// src/media/infrastructure/entities/media.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ 
  collection: 'asset_metadata',
  timestamps: true,
  versionKey: false
})
export class AssetMetadataMongo extends Document {
  @Prop({ required: true, unique: true, index: true })
  assetId: string;

  @Prop({ required: true, unique: true, index: true })
  publicId: string;

  @Prop({ required: true, default: 'cloudinary' })
  provider: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true, min: 0 })
  size: number;

  @Prop({ required: true, unique: true, index: true })
  contentHash: string;

  @Prop({ required: true, default: 1, min: 0 })
  referenceCount: number;

  @Prop({ required: true })
  format: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, type: Date, default: Date.now })
  uploadedAt: Date;
}

export const AssetMetadataMongoSchema = SchemaFactory.createForClass(AssetMetadataMongo);