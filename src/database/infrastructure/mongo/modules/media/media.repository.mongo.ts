// src/multimedia/infrastructure/repository/mongo-file-metadata.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Either } from 'src/core/types/either';
import { IFileMetadataRepository } from 'src/core/application/repository/i-file-metadata.repository';
import { FileMetadataSnapshot } from 'src/core/application/snapshots/i-file-metadata.snapshot';
import { FileMetadataMongo } from '../../entities/media.schema';
import { DatabaseError, DatabaseErrorMapper } from 'src/database/infrastructure/errors';
import { Optional } from 'src/core/types/optional';

@Injectable()
export class FileMetadataMongoRespository implements IFileMetadataRepository {
    
    constructor(
        @InjectModel(FileMetadataMongo.name)
        private readonly model: Model<FileMetadataMongo>,
    ) {}

    async save(metadata: FileMetadataSnapshot): Promise<Either<DatabaseError, void>> {
        try {
            await this.model.findOneAndUpdate(
                { publicId: metadata.publicId },
                metadata,
                { upsert: true, new: true }
            ).exec();
            return Either.makeRight(undefined);
        } catch (error) {
            const dbError = DatabaseErrorMapper.mapMongoError(error, {
                collection: 'file_metadata',
                id: metadata.publicId,
                operation: 'save',
            });
            return Either.makeLeft(dbError);
        }
    }

    async findByPublicId(publicId: string): Promise<Either<DatabaseError, Optional<FileMetadataSnapshot>>> {
    try {
        const doc = await this.model.findOne({ publicId }).exec();
        const optional = doc 
            ? new Optional(doc.toObject() as FileMetadataSnapshot)
            : new Optional<FileMetadataSnapshot>();
        return Either.makeRight(optional);
    } catch (error) {
        const dbError = DatabaseErrorMapper.mapMongoError(error, {
            collection: 'file_metadata',
            id: publicId,
            operation: 'findById',
        });
        return Either.makeLeft(dbError);
    }
}
    
    async incrementReferenceCount(publicId: string): Promise<Either<DatabaseError, void>> {
        try {
            await this.model.findOneAndUpdate(
                { publicId },
                { $inc: { referenceCount: 1 } }
            ).exec();
            return Either.makeRight(undefined);
        } catch (error) {
            const dbError = DatabaseErrorMapper.mapMongoError(error, {
                collection: 'file_metadata',
                id: publicId,
                operation: 'update',
            });
            return Either.makeLeft(dbError);
        }
    }

    async decrementReferenceCount(publicId: string): Promise<Either<DatabaseError, void>> {
        try {
            await this.model.findOneAndUpdate(
                { publicId },
                { $inc: { referenceCount: -1 } }
            ).exec();
            return Either.makeRight(undefined);
        } catch (error) {
            const dbError = DatabaseErrorMapper.mapMongoError(error, {
                collection: 'file_metadata',
                id: publicId,
                operation: 'update',
            });
            return Either.makeLeft(dbError);
        }
    }

    async deleteByPublicId(publicId: string): Promise<Either<DatabaseError, void>> {
        try {
            await this.model.deleteOne({ publicId }).exec();
            return Either.makeRight(undefined);
        } catch (error) {
            const dbError = DatabaseErrorMapper.mapMongoError(error, {
                collection: 'file_metadata',
                id: publicId,
                operation: 'delete',
            });
            return Either.makeLeft(dbError);
        }
    }
}