// src/multimedia/domain/ports/i-file-metadata.repository.ts

import { FileMetadataSnapshot } from '../snapshots/i-file-metadata.snapshot';
import { Optional } from 'src/core/types/optional'; 


export interface IFileMetadataRepository {
    save(metadata: FileMetadataSnapshot): Promise<void>;
    findByPublicId(publicId: string): Promise<Optional<FileMetadataSnapshot>>;
    incrementReferenceCount(publicId: string): Promise<void>;
    decrementReferenceCount(publicId: string): Promise<void>;
    deleteByPublicId(publicId: string): Promise<void>;
}