import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { Inject } from '@nestjs/common';
import { UploadAssetCommand } from './upload-asset.command';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import type { IAssetMetadataDao } from '../../ports/i-asset-metadata.dao.interface';
import type { IAssetStorageService } from '../../ports/i-asset-storage.interface';
import type { ICryptoService } from 'src/core/application/ports/crypto/i-crypto.service';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { AssetMetadataRecord } from '../../ports/i-asset-metadata-record.interface';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { MimeTypeHelper } from '../../helpers/mime-type.helper';
import { ASSET_STORAGE_SERVICE, CRYPTO_SERVICE } from '../../dependency-tokens/application-media.tokens';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';
import { UploadAssetResponse } from '../../dtos/upload-asset.response.dto';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { Log } from 'src/core/application/aspects/logging/log.decorator';


@CommandHandler(UploadAssetCommand)
export class UploadAssetHandler implements ICommandHandler<UploadAssetCommand> {
  constructor(
    @Inject(DaoName.AssetMetadataMongo) private readonly metadataDao: IAssetMetadataDao,
    @Inject(ASSET_STORAGE_SERVICE) private readonly assetStorageService: IAssetStorageService,
    @Inject(CRYPTO_SERVICE) private readonly cryptoService: ICryptoService,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator<string>,
  ) { }
  
  @Log()
  async execute(command: UploadAssetCommand): Promise<Either<ErrorData, UploadAssetResponse>> {
    const contentHash = this.cryptoService.calculateSha256(command.fileBuffer || Buffer.alloc(0));

    // 1. DEDUPLICACIÓN: Si ya existe, incrementamos referencia y retornamos
    const existingAsset = await this.metadataDao.findByContentHash(contentHash);
    if (existingAsset.isRight() && existingAsset.getRight()) {
      return this.handleExistingAsset(existingAsset.getRight()!);
    }

    // 2. FLUJO NUEVO: Generar ID y procesar
    const assetId = await this.idGenerator.generateId();
    
    return pipeAsync<ErrorData, UploadAssetResponse>(
      this.assetStorageService.upload(
        command.fileBuffer, 
        command.mimeType, 
        command.originalName, 
        `kahoot_images/${assetId}`
      ),

      res => res.chainAsync(async (storage) => {
        const record = this.mapToRecord(assetId, storage, command, contentHash);
        const saveResult = await this.metadataDao.insert(record);
        
        if (saveResult.isLeft()) {
          // Compensación manual si falla la DB
          await this.assetStorageService.delete(storage.publicId, storage.provider);
          return Either.makeLeft(saveResult.getLeft());
        }

        return Either.makeRight(this.mapToResponse(record));
      })
    );
  }

  private async handleExistingAsset(asset: AssetMetadataRecord): Promise<Either<ErrorData, UploadAssetResponse>> {
    const incrementResult = await this.metadataDao.incrementReferenceCount(asset.publicId);
    return incrementResult.map(() => this.mapToResponse(asset));
  }

  private mapToResponse(data: AssetMetadataRecord): UploadAssetResponse {
    return { 
      assetId: data.assetId, mimeType: data.mimeType, size: data.size, 
      format: data.format, category: data.category 
    };
  }

  private mapToRecord(
    assetId: string, 
    storage: { publicId: string; provider: string; mimeType: string; size: number; format: string }, 
    cmd: UploadAssetCommand, 
    hash: string
  ): AssetMetadataRecord {
    return {
      assetId, publicId: storage.publicId, provider: storage.provider, originalName: cmd.originalName,
      mimeType: storage.mimeType, size: storage.size, contentHash: hash, referenceCount: 1,
      format: storage.format, category: MimeTypeHelper.getCategory(cmd.mimeType), 
      theme: false, uploadedAt: new Date(),
    };
  }
}