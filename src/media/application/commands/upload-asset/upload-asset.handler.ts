// src/media/application/commands/upload-asset/upload-asset.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UploadAssetCommand } from './upload-asset.command';
import type { IAssetMetadataDao } from '../../ports/asset-metadata.dao';
import type { IAssetStorageService } from '../../ports/asset-storage.service';
import type { ICryptoService } from 'src/core/application/ports/crypto/i-crypto.service';
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import type { IAssetUrlService } from '../../ports/asset-url-generator.interface';
import { AssetMetadataRecord } from '../../ports/asset-metadata-record.interface';
import { AssetMetadataReadModel } from '../../read-model/asset-metadata.read.model';
import { Either } from 'src/core/types/either';
import { 
  MediaApplicationError,
  MediaErrorFactory 
} from '../../errors';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';


// Helper local (mover a archivo separado después)
class MimeTypeHelper {
  static getFormat(mimeType: string): string {
    return mimeType.split('/')[1] || 'unknown';
  }

  static getCategory(mimeType: string): string {
    const [type] = mimeType.split('/');
    const categories: Record<string, string> = {
      'image': 'image',
      'video': 'video',
      'audio': 'audio',
      'application': 'document',
      'text': 'document'
    };
    return categories[type] || 'other';
  }

  static isImage(mimeType: string): boolean {
    return this.getCategory(mimeType) === 'image';
  }

  static isVideo(mimeType: string): boolean {
    return this.getCategory(mimeType) === 'video';
  }

  static isDocument(mimeType: string): boolean {
    const category = this.getCategory(mimeType);
    return category === 'document' || category === 'text';
  }
}

export type UploadAssetResult = {
  assetId: string;
  publicId: string;
  url: string;
  metadata: AssetMetadataReadModel;
  isDuplicate: boolean;
};

@CommandHandler(UploadAssetCommand)
export class UploadAssetHandler implements ICommandHandler<UploadAssetCommand, Either<MediaApplicationError, UploadAssetResult>> {
  constructor(
    @Inject(DaoName.AssetMetadataMongo)
    private readonly metadataDao: IAssetMetadataDao,
    @Inject('IAssetStorageService')
    private readonly assetStorageService: IAssetStorageService,
    @Inject('ICryptoService')
    private readonly cryptoService: ICryptoService,
    @Inject('IAssetUrl')
    private readonly urlGenerator: IAssetUrlService,
    @Inject('IdGenerator')
    private readonly idGenerator: IdGenerator<string>,
  ) {}

  async execute(command: UploadAssetCommand): Promise<Either<MediaApplicationError, UploadAssetResult>> {
    if (!command.fileBuffer || command.fileBuffer.length === 0) {
      return Either.makeLeft(MediaErrorFactory.emptyFile());
    }

    try {
      // 1. Calcular hash del contenido
      const contentHash = this.cryptoService.calculateSha256(command.fileBuffer);
      
      // 2. Verificar si ya existe (deduplicación)
      const duplicateResult = await this.metadataDao.findByContentHash(contentHash);
      
      if (duplicateResult.isRight() && duplicateResult.getRight().hasValue()) {
        const existing = duplicateResult.getRight().getValue();
        
        // Incrementar contador de referencias
        const incrementResult = await this.metadataDao.incrementReferenceCount(existing.publicId);
        if (incrementResult.isLeft()) {
          return Either.makeLeft(
            MediaErrorFactory.uploadFailed(`Failed to increment reference: ${incrementResult.getLeft().message}`)
          );
        }
        
        // Generar URL usando el nuevo método simple
        const url = this.urlGenerator.generateUrl(existing.provider, existing.publicId);
        
        return Either.makeRight({
          assetId: existing.assetId,
          publicId: existing.publicId,
          url,
          metadata: this.toReadModel(existing),
          isDuplicate: true,
        });
      }
      
      // 3. Generar IDs (NUEVA SUBIDA)
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
        return Either.makeLeft(
          MediaErrorFactory.storageUploadFailed('cloudinary', uploadResult.getLeft().message)
        );
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
        await this.assetStorageService.delete(record.publicId, record.provider);
        return Either.makeLeft(
          MediaErrorFactory.uploadFailed(`Failed to save metadata: ${saveResult.getLeft().message}`)
        );
      }
      
      // 6. Generar URL para respuesta
      const url = this.urlGenerator.generateUrl(record.provider, record.publicId);
      
      return Either.makeRight({
        assetId,
        publicId: record.publicId,
        url,
        metadata: this.toReadModel(record),
        isDuplicate: false,
      });
      
    } catch (error) {
      return Either.makeLeft(
        MediaErrorFactory.uploadFailed(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }
  
  private toReadModel(record: AssetMetadataRecord): AssetMetadataReadModel {
    const url = this.urlGenerator.generateUrl(record.provider, record.publicId);
    
    return {
      ...record,
      url,
      isImage: MimeTypeHelper.isImage(record.mimeType),
      isVideo: MimeTypeHelper.isVideo(record.mimeType),
      isDocument: MimeTypeHelper.isDocument(record.mimeType),
    };
  }
}