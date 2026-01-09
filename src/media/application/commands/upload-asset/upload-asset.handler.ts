/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\commands\upload-asset\upload-asset.handler.ts

import { Inject } from '@nestjs/common';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';

// Tipos Core
import { Either, ErrorData } from 'src/core/types';
import { Log } from 'src/core/application/aspects/logging/log.decorator';

// Interfaces de Puertos
import type { IAssetMetadataDao } from '../../ports/i-asset-metadata.dao.interface';
import type { IAssetStorageService } from '../../ports/i-asset-storage.interface';
import type { ICryptoService } from 'src/core/application/ports/crypto/i-crypto.interface';
import type { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';

import { UploadAssetCommand } from './upload-asset.command';
import { AssetMetadataRecord } from '../../ports/i-asset-metadata-record.interface';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { MimeTypeHelper } from '../../helpers/mime-type.helper';
import { MEDIA_TOKENS } from '../../dependency-tokens/application-media.tokens';
import { UploadAssetResponse } from '../../dtos/upload-asset.response.dto';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';

@CommandHandler(UploadAssetCommand)
export class UploadAssetHandler implements ICommandHandler<UploadAssetCommand> {
  constructor(
    @Inject(DaoName.AssetMetadata) 
    private readonly metadataDao: IAssetMetadataDao,
    
    @Inject(MEDIA_TOKENS.ASSET_STORAGE_SERVICE) 
    private readonly assetStorageService: IAssetStorageService,
    
    @Inject(APPLICATION_CORE_TOKENS.UTILS.CRYPTO_SERVICE) 
    private readonly cryptoService: ICryptoService,
    
    @Inject(APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR) 
    private readonly idGenerator: IdGenerator<string>,

    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
  ) { }
  
  @Log()
  async execute(command: UploadAssetCommand): Promise<Either<ErrorData, UploadAssetResponse>> {
    // 1. Cálculo de Hash previo
    const contentHash = this.cryptoService.calculateSha256(command.fileBuffer || Buffer.alloc(0));

    // 2. FLUJO ROP ESTRICTO: La consulta de deduplicación es lo que inicia el ROP
    const deduplicationResult = await this.metadataDao.findByContentHash(contentHash);

    return deduplicationResult.chainAsync(async (existingAsset) => {
      
      // CASO A: El asset ya existe (Deduplicación exitosa)
      if (existingAsset) {
        return this.handleExistingAsset(existingAsset);
      }

      // CASO B: El asset es nuevo (Flujo de Subida y Registro)
      const assetId = await this.idGenerator.generateId();
      
      // B.1 Subida al almacenamiento externo (Cloudinary/S3)
      const storageResult = await this.assetStorageService.upload(
        command.fileBuffer, 
        command.mimeType, 
        command.originalName, 
        `kahoot_images/${assetId}`
      );

      // B.2 Registro en Base de Datos con Compensación
      return storageResult.chainAsync(async (storage) => {
        const record = this.mapToRecord(assetId, storage, command, contentHash);
        const saveResult = await this.metadataDao.insert(record);

        // Si el insert falla, disparamos tapLeftAsync para borrar el archivo del storage
        const compensatedResult = await saveResult.tapLeftAsync(async () => {
          await this.assetStorageService.delete(storage.publicId, storage.provider);
        });

        return compensatedResult.map(() => this.mapToResponse(record));
      });
    });
  }

  /**
   * Maneja assets existentes incrementando su contador de referencias.
   */
  private async handleExistingAsset(asset: AssetMetadataRecord): Promise<Either<ErrorData, UploadAssetResponse>> {
    const incrementResult = await this.metadataDao.incrementReferenceCount(asset.publicId);
    return incrementResult.map(() => this.mapToResponse(asset));
  }

  private mapToResponse(data: AssetMetadataRecord): UploadAssetResponse {
    return { 
      assetId: data.assetId, 
      mimeType: data.mimeType, 
      size: data.size, 
      format: data.format, 
      category: data.category 
    };
  }

  private mapToRecord(
    assetId: string, 
    storage: any, 
    cmd: UploadAssetCommand, 
    hash: string
  ): AssetMetadataRecord {
    return {
      assetId, 
      publicId: storage.publicId, 
      provider: storage.provider, 
      originalName: cmd.originalName,
      mimeType: storage.mimeType, 
      size: storage.size, 
      contentHash: hash, 
      referenceCount: 1,
      format: storage.format, 
      category: MimeTypeHelper.getCategory(cmd.mimeType), 
      theme: false, 
      uploadedAt: new Date(),
    };
  }
}