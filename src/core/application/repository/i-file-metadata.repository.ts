// src/multimedia/domain/ports/i-file-metadata.repository.ts

import { FileMetadataSnapshot } from '../snapshots/i-file-metadata.snapshot';
import { Optional } from 'src/core/types/optional'; 
import { Either } from '../../types/either';
import { DatabaseError } from 'src/database/infrastructure/errors';


export interface IFileMetadataRepository {
    save(metadata: FileMetadataSnapshot): Promise<Either<DatabaseError, void>>;
    findByPublicId(publicId: string): Promise<Either<DatabaseError, Optional<FileMetadataSnapshot>>>;
    incrementReferenceCount(publicId: string): Promise<Either<DatabaseError, void>>;
    decrementReferenceCount(publicId: string): Promise<Either<DatabaseError, void>>;
    deleteByPublicId(publicId: string): Promise<Either<DatabaseError, void>>;
}