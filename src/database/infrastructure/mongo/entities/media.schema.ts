// src/database/infrastructure/mongo/entities/file-metadata.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { FileMetadataSnapshot } from 'src/core/application/snapshots/i-file-metadata.snapshot';

@Schema({ collection: 'file_metadata' })
export class FileMetadataMongo extends Document implements FileMetadataSnapshot {
    @Prop({ required: true, unique: true, index: true })
    publicId: string; // El UUID (ID que usa Kahoot)
    @Prop({ required: true, index: true })
    contentHash: string; // El Hash (ID que usa Cloudinary)
    @Prop({ required: true })
    mimeType: string;
    @Prop({ required: true, default: 0 })
    referenceCount: number; // 0 = PENDING, > 0 = COMMITTED
    @Prop({ type: String, required: true })
    createdAt: string;
}

export const FileMetadataSchema = SchemaFactory.createForClass(FileMetadataMongo);