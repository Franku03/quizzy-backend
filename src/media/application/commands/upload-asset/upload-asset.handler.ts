import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UploadAssetCommand } from './upload-asset.command';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { FileMetadataSnapshot } from 'src/core/application/snapshots/i-file-metadata.snapshot';
import type { IFileMetadataRepository } from 'src/core/application/repository/i-file-metadata.repository';
import type { IAssetStorageService } from 'src/media/application/ports/asset-storage/i-asset-storage.service';
import type { ICryptoService } from 'src/core/application/ports/crypto/i-crypto.service';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { CloudinaryError } from 'src/media/infraestructure/adapters/errors';
import { DatabaseError } from 'src/database/infrastructure/errors';
import { Either } from 'src/core/types/either';


export type UploadAssetError = 
  | DatabaseError
  | CloudinaryError
  | {
      type: 'InvalidFile';
      message: string;
      timestamp: Date;
    }
  | {
      type: 'UnexpectedError';
      message: string;
      timestamp: Date;
      originalError?: any;
    };
    
@CommandHandler(UploadAssetCommand)
export class UploadAssetHandler implements ICommandHandler<UploadAssetCommand, Either<UploadAssetError, string>> {
    constructor(
        @Inject(RepositoryName.FileMetadata)
        private readonly metadataRepository: IFileMetadataRepository,
        @Inject('IAssetStorageService')
        private readonly assetStorageService: IAssetStorageService,
        @Inject('ICryptoService')
        private readonly cryptoService: ICryptoService,
        @Inject(UuidGenerator)
        private readonly idGenerator: IdGenerator<string>,
    ) {}

    async execute(command: UploadAssetCommand): Promise<Either<UploadAssetError, string>> {
        
        // 1. Validar archivo
        if (!command.fileBuffer || command.fileBuffer.length === 0) {
            return Either.makeLeft({
                type: 'InvalidFile',
                message: 'El archivo está vacío',
                timestamp: new Date(),
            });
        }

        if (!command.mimeType || command.mimeType.trim() === '') {
            return Either.makeLeft({
                type: 'InvalidFile',
                message: 'El tipo MIME del archivo es inválido',
                timestamp: new Date(),
            });
        }

        // 2. Generar IDs
        let publicId: string;
        try {
            publicId = await this.idGenerator.generateId();
        } catch (error) {
            return Either.makeLeft({
                type: 'UnexpectedError',
                message: 'Error generando ID para el asset',
                timestamp: new Date(),
                originalError: error,
            });
        }

        const contentHash = this.cryptoService.calculateSha256(command.fileBuffer);

        // 3. Subir a Cloudinary
        const uploadResult = await this.assetStorageService.uploadAndDeduplicate(
            command.fileBuffer,
            contentHash
        );

        if (uploadResult.isLeft()) {
            return Either.makeLeft(uploadResult.getLeft());
        }

        const cloudinaryPublicId = uploadResult.getRight();

        // 4. Crear metadatos
        const metadataSnapshot: FileMetadataSnapshot = {
            publicId,
            contentHash: cloudinaryPublicId,
            mimeType: command.mimeType,
            referenceCount: 0,
            createdAt: new Date().toISOString(),
        };

        // 5. Guardar en base de datos
        const saveResult = await this.metadataRepository.save(metadataSnapshot);
        
        if (saveResult.isLeft()) {
            // Compensación: eliminar de Cloudinary si falla en DB
            const deleteResult = await this.assetStorageService.deleteAsset(cloudinaryPublicId);
            
            // Log si falla la compensación, pero no afectamos el error principal
            if (deleteResult.isLeft()) {
                console.error('Error en compensación (eliminar de Cloudinary):', deleteResult.getLeft());
            }
            
            return Either.makeLeft(saveResult.getLeft());
        }

        return Either.makeRight(publicId);
    }
}