import { Inject, Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import { UploadApiResponse} from 'cloudinary';
import { IAssetStorageService } from 'src/media/application/ports/i-asset-storage.interface';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { IExternalServiceErrorContext } from 'src/core/errors/interface/context/i-extenral-service.context';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { ERROR_MAPPER, CLOUDINARY_CONFIG } from 'src/media/application/dependency-tokens/application-media.tokens';

@Injectable()
export class CloudinaryStorageAdapter implements IAssetStorageService {
  constructor(
    @Inject(ERROR_MAPPER)
    private readonly errorMapper: IErrorMapper<IExternalServiceErrorContext>,
    @Inject(CLOUDINARY_CONFIG)
    private readonly cloudinaryInstance: typeof cloudinary.v2
  ) { }

  async upload(
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
    publicId: string
  ): Promise<Either<ErrorData, { publicId: string; provider: string; mimeType: string; format: string; size: number }>> {
    const baseFolder = process.env.CLOUDINARY_ASSET_FOLDER || 'quizzy_assets';
    const [folderPath, assetId] = publicId.split('/');
    const cleanName = this.slugify(originalName);
    const targetFolder = `${baseFolder}/${folderPath}`;
    const fileName = `${cleanName}-${assetId.substring(0, 6)}`;

    const isGif = mimeType === 'image/gif';
    const isSvg = mimeType.includes('svg');
    const shouldConvert = mimeType.startsWith('image/') && !isGif && !isSvg;

    const context: IExternalServiceErrorContext = {
      operation: 'upload',
      adapterName: CloudinaryStorageAdapter.name,
      portName: 'IAssetStorageService',
      serviceName: 'cloudinary',
      resourceId: fileName
    };

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        this.cloudinaryInstance.uploader.upload_stream(
          {
            public_id: fileName,
            folder: targetFolder,
            asset_folder: targetFolder,
            resource_type: 'auto',
            format: shouldConvert ? 'webp' : undefined,
            quality: shouldConvert ? 'auto:best' : undefined,
            flags: 'preserve_transparency',
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('Cloudinary upload result is undefined'));
            resolve(result);
          }
        ).end(fileBuffer);
      });

      return Either.makeRight({
        publicId: result.public_id,
        provider: 'cloudinary',
        mimeType: shouldConvert ? 'image/webp' : mimeType,
        format: shouldConvert ? 'webp' : result.format,
        size: result.bytes
      });
    } catch (error) {
      return Either.makeLeft(this.errorMapper.toErrorData(error, context));
    }
  }

  async delete(publicId: string, provider: string): Promise<Either<ErrorData, void>> {
    const context: IExternalServiceErrorContext = {
      operation: 'delete',
      adapterName: CloudinaryStorageAdapter.name,
      portName: 'IAssetStorageService',
      serviceName: 'cloudinary',
      resourceId: publicId
    };

    try {
      if (provider !== 'cloudinary') {
        return Either.makeLeft(new ErrorData("ADAPTER_MISMATCH", "Expected cloudinary", ErrorLayer.INFRASTRUCTURE, context));
      }
      await this.cloudinaryInstance.uploader.destroy(publicId, { resource_type: 'auto' });
      return Either.makeRight(undefined);
    } catch (error) {
      return Either.makeLeft(this.errorMapper.toErrorData(error, context));
    }
  }

  private slugify(text: string): string {
    return text.split('.')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').trim();
  }
}