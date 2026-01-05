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

    const contentHash = this.cryptoService.calculateSha256(command.fileBuffer);

    // Definimos el pipe especificando que al final queremos un UploadAssetResponse
    return pipeAsync<ErrorData, UploadAssetResponse>(
      // 1. Buscar duplicado
      this.metadataDao.findByContentHash(contentHash),

      // 2. Switcher: Si existe devuelve DTO, si no, objeto inicial
      k => k.chainAsync(async existing => 
        existing 
          ? (await this.metadataDao.incrementReferenceCount(existing.publicId)).map(() => this.mapToResponse(existing))
          : Either.makeRight({ isNew: true, assetId: await this.idGenerator.generateId() } as any)
      ),

      // 3. Subida Física (Unless ya sea DTO)
      k => k.chainUnlessAsync(
        val => !(val as any).isNew,
        async (data: any) => (await this.assetStorageService.upload(
          command.fileBuffer, command.mimeType, command.originalName, `kahoot_images/${data.assetId}`
        )).map(storage => ({ ...data, storage }))
      ),

      // 4. Persistencia y Transformación Final
      k => k.chainAsync(async (data: any) => {
        // Si no es nuevo, ya es un DTO, lo devolvemos tal cual para cerrar el tipo
        if (!data.isNew) return Either.makeRight(data as UploadAssetResponse);
        
        const record = this.mapToRecord(data.assetId, data.storage, command, contentHash);
        const saveResult = await this.metadataDao.insert(record);
        
        if (saveResult.isLeft()) {
          await this.assetStorageService.delete(data.storage.publicId, data.storage.provider);
          return Either.makeLeft(saveResult.getLeft());
        }
        
        return Either.makeRight(this.mapToResponse(record));
      })
    );
  }

  private mapToResponse(data: any): UploadAssetResponse {
    return {
      assetId: data.assetId,
      mimeType: data.mimeType,
      size: data.size,
      format: data.format,
      category: data.category || MimeTypeHelper.getCategory(data.mimeType),
    };
  }

  private mapToRecord(assetId: string, storage: any, command: UploadAssetCommand, hash: string): AssetMetadataRecord {
    return {
      assetId,
      publicId: storage.publicId,
      provider: storage.provider,
      originalName: command.originalName,
      mimeType: storage.mimeType,
      size: storage.size,
      contentHash: hash,
      referenceCount: 1,
      format: storage.format,
      category: MimeTypeHelper.getCategory(command.mimeType),
      uploadedAt: new Date(),
    };
  }
}