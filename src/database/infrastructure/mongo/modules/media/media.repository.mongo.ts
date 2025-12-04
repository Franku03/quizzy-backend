// src/multimedia/infrastructure/repository/mongo-file-metadata.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Optional } from 'src/core/types/optional';
import { IFileMetadataRepository } from 'src/core/application/repository/i-file-metadata.repository';
import { FileMetadataSnapshot } from 'src/core/application/snapshots/i-file-metadata.snapshot';
import { FileMetadataMongo } from '../../entities/media.schema';

@Injectable()
export class FileMetadataMongoRespository implements IFileMetadataRepository {
    
    constructor(
        @InjectModel(FileMetadataMongo.name)
        private readonly model: Model<FileMetadataMongo>,
    ) {}

    async save(metadata: FileMetadataSnapshot): Promise<void> {
        // Usa upsert para crear o actualizar un documento (aunque en el save inicial siempre será nuevo)
        await this.model.findOneAndUpdate(
            { publicId: metadata.publicId },
            metadata,
            { upsert: true, new: true }
        ).exec();
    }

    async findByPublicId(publicId: string): Promise<Optional<FileMetadataSnapshot>> {
        const doc = await this.model.findOne({ publicId }).exec();
        
        // El Optional se usa para manejar la ausencia de datos
        if (!doc) {
            return new Optional<FileMetadataSnapshot>();
        }
        return new Optional(doc.toObject() as FileMetadataSnapshot);
    }
    
    async incrementReferenceCount(publicId: string): Promise<void> {
        // Incrementa e el contador
        await this.model.findOneAndUpdate(
            { publicId },
            { $inc: { referenceCount: 1 } }
        ).exec();
    }

    async decrementReferenceCount(publicId: string): Promise<void> {
        // Decrementa el contador
        await this.model.findOneAndUpdate(
            { publicId },
            { $inc: { referenceCount: -1 } }
        ).exec();
    }

    async deleteByPublicId(publicId: string): Promise<void> {
        await this.model.deleteOne({ publicId }).exec();
    }
}