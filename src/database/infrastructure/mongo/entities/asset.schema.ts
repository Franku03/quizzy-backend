/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\entities\asset.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DbMongoDocument } from '../decorators/db-mongo-document.decorator';
import { DbMongoSchema } from '../decorators/db-mongo-schema.decorator';

// Database Collection Name
const COLLECTION_NAME: string = 'asset_metadata';

@DbMongoDocument(COLLECTION_NAME)
@Schema({
  collection: COLLECTION_NAME,
  timestamps: true,
  versionKey: false,
})
export class AssetMetadata extends Document {
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

  @Prop({ required: true, default: false })
  theme: boolean;

  @Prop({ required: true, type: Date, default: Date.now })
  uploadedAt: Date;
}

export const AssetMetadataMongoSchema =
  SchemaFactory.createForClass(AssetMetadata);

DbMongoSchema(COLLECTION_NAME)(AssetMetadataMongoSchema);
