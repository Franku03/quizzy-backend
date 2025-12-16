// src/media/application/commands/upload-asset/upload-asset.handler.ts
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { Inject, Logger } from '@nestjs/common'; 
import { UploadAssetCommand } from './upload-asset.command';

// Importaciones de Contratos
import type { IAssetMetadataDao } from '../../ports/asset-metadata.dao';
import type { IAssetStorageService } from '../../ports/asset-storage.service';
import type { ICryptoService } from 'src/core/application/ports/crypto/i-crypto.service';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { AssetMetadataRecord } from '../../ports/asset-metadata-record.interface';

// Importaciones Universales y Genéricas
import { Either, ErrorData, ErrorLayer } from 'src/core/types'; 

import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { MimeTypeHelper } from '../../helpers/mime-type.helper';
import { ASSET_STORAGE_SERVICE, CRYPTO_SERVICE } from '../../dependecy-tokkens/application-media.tokens';
import { ID_GENERATOR } from 'src/core/application/ports/crypto/core-application.tokens';

export type UploadAssetResult = {
  assetId: string;
  mimeType: string;
  size: number;
  format: string;
  category: string;
};

@CommandHandler(UploadAssetCommand)         //ICommandHandler<UploadAssetCommand, Either<ErrorData, UploadAssetResult>>
export class UploadAssetHandler implements ICommandHandler<UploadAssetCommand> {
  private readonly logger = new Logger(UploadAssetHandler.name); 

  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly metadataDao: IAssetMetadataDao,
    @Inject(ASSET_STORAGE_SERVICE)
    private readonly assetStorageService: IAssetStorageService,
    @Inject(CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator<string>,
  ) {}

  async execute(command: UploadAssetCommand): Promise<Either<ErrorData, UploadAssetResult>> {

    // Validación simple (sin contexto complejo)
    if (!command.fileBuffer || command.fileBuffer.length === 0) {
      const error = new ErrorData(
        "VALIDATION_FAILED",
        "File buffer is empty",
        ErrorLayer.APPLICATION,
        { operation: 'uploadAsset', fileName: command.originalName }
      );
      return Either.makeLeft(error);
    }

    try {
      // 1. Calcular hash del contenido
      const contentHash = this.cryptoService.calculateSha256(command.fileBuffer);
      
      // 2. Verificar si ya existe (deduplicación)
      const duplicateResult = await this.metadataDao.findByContentHash(contentHash);
      
      if (duplicateResult.isLeft()) {
          return Either.makeLeft(duplicateResult.getLeft()); // Error ya tiene contexto
      }
      
      const existing = duplicateResult.getRight(); 

      if (existing !== null) {
        // Lógica de duplicado (mismo hash)
        
        // Incrementar contador de referencias
        const incrementResult = await this.metadataDao.incrementReferenceCount(existing.publicId);
        if (incrementResult.isLeft()) {
          return Either.makeLeft(incrementResult.getLeft()); // Error ya tiene contexto
        }
        
        // Retornar datos básicos del duplicado
        return Either.makeRight({
          assetId: existing.assetId,
          mimeType: existing.mimeType,
          size: existing.size,
          format: existing.format,
          category: existing.category,
        });
      }
      
      // 3. Generar ID (NUEVA SUBIDA)
      const assetId = await this.idGenerator.generateId();
      const publicId = assetId; 
      
      // 4. Subir a storage
      const uploadResult = await this.assetStorageService.upload(
        command.fileBuffer,
        command.mimeType,
        command.originalName,
        publicId
      );
      
      if (uploadResult.isLeft()) {
        return Either.makeLeft(uploadResult.getLeft()); // Error ya tiene contexto
      }
      
      const storageResult = uploadResult.getRight();
      
      // 5. Crear registro en base de datos
      const record: AssetMetadataRecord = {
        assetId,
        publicId: storageResult.publicId,
        provider: storageResult.provider,
        originalName: command.originalName,
        mimeType: command.mimeType,
        size: command.fileBuffer.length,
        contentHash,
        referenceCount: 1,
        format: MimeTypeHelper.getFormat(command.mimeType),
        category: MimeTypeHelper.getCategory(command.mimeType),
        uploadedAt: new Date(),
      };
      
      const saveResult = await this.metadataDao.insert(record);
      if (saveResult.isLeft()) {
        // Rollback: eliminar del storage si falla la BD
        const rollbackResult = await this.assetStorageService.delete(record.publicId, record.provider);
        if (rollbackResult.isLeft()) {
             this.logger.error('CRITICAL: Failed rollback after metadata save failure.', { 
               rollbackError: rollbackResult.getLeft(), 
               saveError: saveResult.getLeft() 
             });
        }

        return Either.makeLeft(saveResult.getLeft()); // Error ya tiene contexto
      }
      
      // Retornar datos básicos de la nueva subida
      return Either.makeRight({
        assetId,
        mimeType: record.mimeType,
        size: record.size,
        format: record.format,
        category: record.category,
      });
      
    } catch (error) {
      // Error inesperado de aplicación (no viene como Either)
      if (error instanceof ErrorData) {
        this.logger.error(`Unexpected ErrorData in upload: ${error.code}`, error);
        return Either.makeLeft(error);
      }

      const unexpectedError = new ErrorData(
        "APPLICATION_UNEXPECTED_ERROR",
        `Unexpected error during upload: ${error instanceof Error ? error.message : String(error)}`,
        ErrorLayer.APPLICATION, 
        {
          operation: 'uploadAsset',
          fileName: command.originalName,
          fileSize: command.fileBuffer?.length,
        },
        error as Error
      );
      
      this.logger.error('Unexpected runtime error in UploadAssetHandler', unexpectedError);
      return Either.makeLeft(unexpectedError);
    }
  }
}