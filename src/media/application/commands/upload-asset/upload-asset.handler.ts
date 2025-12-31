import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { Inject } from '@nestjs/common';
import { UploadAssetCommand } from './upload-asset.command';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import type { IAssetMetadataDao } from '../../ports/asset-metadata.dao';
import type { IAssetStorageService } from '../../ports/asset-storage.service';
import type { ICryptoService } from 'src/core/application/ports/crypto/i-crypto.service';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { AssetMetadataRecord } from '../../ports/asset-metadata-record.interface';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { MimeTypeHelper } from '../../helpers/mime-type.helper';
import { ASSET_STORAGE_SERVICE, CRYPTO_SERVICE } from '../../dependecy-tokkens/application-media.tokens';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';
import { UploadAssetResponse } from './upload-asset.response.dto';

@CommandHandler(UploadAssetCommand)
export class UploadAssetHandler implements ICommandHandler<UploadAssetCommand> {
  constructor(
    @Inject(DaoName.AssetMetadataMongo) private readonly metadataDao: IAssetMetadataDao,
    @Inject(ASSET_STORAGE_SERVICE) private readonly assetStorageService: IAssetStorageService,
    @Inject(CRYPTO_SERVICE) private readonly cryptoService: ICryptoService,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator<string>,
  ) { }

  async execute(command: UploadAssetCommand): Promise<Either<ErrorData, UploadAssetResponse>> {
    if (!command.fileBuffer || command.fileBuffer.length === 0) {
      return Either.makeLeft(new ErrorData("VALIDATION_FAILED", "File buffer is empty", ErrorLayer.APPLICATION));
    }

    try {
      // PASO 1: Deduplicación
      const contentHash = this.cryptoService.calculateSha256(command.fileBuffer);
      const duplicateResult = await this.metadataDao.findByContentHash(contentHash);
      if (duplicateResult.isLeft()) return Either.makeLeft(duplicateResult.getLeft());

      const existing = duplicateResult.getRight();
      if (existing) {
        await this.metadataDao.incrementReferenceCount(existing.publicId);
        return Either.makeRight(existing);
      }

      // PASO 2: Proceso de subida
      const assetId = await this.idGenerator.generateId();
      const uploadResult = await this.assetStorageService.upload(
        command.fileBuffer,
        command.mimeType,
        command.originalName,
        `kahoot_images/${assetId}`
      );

      if (uploadResult.isLeft()) return Either.makeLeft(uploadResult.getLeft());
      const storageResult = uploadResult.getRight();

      // PASO 3: Persistencia
      const record: AssetMetadataRecord = {
        assetId,
        publicId: storageResult.publicId,
        provider: storageResult.provider,
        originalName: command.originalName,
        mimeType: storageResult.mimeType,
        size: storageResult.size,
        contentHash,
        referenceCount: 1,
        format: storageResult.format,
        category: MimeTypeHelper.getCategory(command.mimeType),
        theme: true,
        uploadedAt: new Date(),
      };

      const saveResult = await this.metadataDao.insert(record);
      if (saveResult.isLeft()) {
        await this.assetStorageService.delete(record.publicId, record.provider);
        return Either.makeLeft(saveResult.getLeft());
      }

      // PASO 4: Respuesta
      return Either.makeRight({
        assetId: record.assetId,
        mimeType: record.mimeType,
        size: record.size,
        format: record.format,
        category: record.category,
      });

    } catch (error) {
      return Either.makeLeft(new ErrorData("APPLICATION_UNEXPECTED_ERROR", error.message, ErrorLayer.APPLICATION));
    }
  }
}