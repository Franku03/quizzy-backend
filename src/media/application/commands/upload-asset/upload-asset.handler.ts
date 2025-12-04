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

@CommandHandler(UploadAssetCommand)
export class UploadAssetHandler implements ICommandHandler<UploadAssetCommand, string> {
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

    async execute(command: UploadAssetCommand): Promise<string> {
        const publicId = await this.idGenerator.generateId();
        const contentHash = this.cryptoService.calculateSha256(command.fileBuffer);

        const cloudinaryPublicId = await this.assetStorageService.uploadAndDeduplicate(
            command.fileBuffer,
            contentHash
        );

        const metadataSnapshot: FileMetadataSnapshot = {
            publicId,
            contentHash: cloudinaryPublicId,
            mimeType: command.mimeType,
            referenceCount: 0,
            createdAt: new Date().toISOString(),
        };

        await this.metadataRepository.save(metadataSnapshot);

        return publicId;
    }
}