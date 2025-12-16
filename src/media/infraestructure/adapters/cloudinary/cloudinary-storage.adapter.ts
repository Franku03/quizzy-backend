// src/media/infrastructure/cloudinary/cloudinary-storage.adapter.ts

import { Inject, Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

import { IAssetStorageService } from 'src/media/application/ports/asset-storage.service';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { IExternalServiceErrorContext } from 'src/core/errors/interface/context/i-extenral-service.context';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { ERROR_MAPPER, CLOUDINARY_CONFIG } from 'src/media/application/dependecy-tokkens/application-media.tokens';

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
  ): Promise<Either<ErrorData, { publicId: string; provider: string }>> {

    const context: IExternalServiceErrorContext = {
      operation: 'upload',
      adapterName: CloudinaryStorageAdapter.name,
      portName: 'IAssetStorageService',
      serviceName: 'cloudinary',
      resourceId: publicId,
      fileSize: fileBuffer.length,
      mimeType: mimeType,
      folder: process.env.CLOUDINARY_ASSET_FOLDER || 'quizzy_assets',
    };

    try {
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      if (mimeType.startsWith('image/')) {
        resourceType = 'image';
      } else if (mimeType.startsWith('video/')) {
        resourceType = 'video';
      } else if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
        resourceType = 'raw';
      }

      const result = await new Promise<UploadApiResponse | { public_id: string; existing: true }>((resolve, reject) => {
        const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
          {
            public_id: publicId,
            overwrite: false,
            resource_type: resourceType,
            folder: context.folder,
            type: 'upload',
          },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              if (error.http_code === 400 && error.message.includes('already exists')) {
                resolve({ public_id: publicId, existing: true });
              } else {
                reject(error);
              }
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(fileBuffer);
      });

      return Either.makeRight({
        publicId: result.public_id,
        provider: 'cloudinary'
      });

    } catch (error) {
      const errorData = this.errorMapper.toErrorData(error, context);
      return Either.makeLeft(errorData);
    }
  }

  async delete(publicId: string, provider: string): Promise<Either<ErrorData, void>> {
    const context: IExternalServiceErrorContext = {
      operation: 'delete',
      adapterName: CloudinaryStorageAdapter.name,
      portName: 'IAssetStorageService',
      serviceName: 'cloudinary',
      resourceId: publicId,
    };

    try {
      if (provider !== 'cloudinary') {
        const error = new ErrorData(
          "ADAPTER_MISMATCH",
          `Provider mismatch: expected 'cloudinary', got '${provider}'`,
          ErrorLayer.INFRASTRUCTURE,
          context
        );
        return Either.makeLeft(error);
      }

      await this.cloudinaryInstance.uploader.destroy(publicId, {
        resource_type: 'auto'
      });

      return Either.makeRight(undefined);

    } catch (error) {
      const errorData = this.errorMapper.toErrorData(error, context);
      return Either.makeLeft(errorData);
    }
  }

  async generateUrl(publicId: string): Promise<Either<ErrorData, string>> {
    const context: IExternalServiceErrorContext = {
      operation: 'generate-url',
      adapterName: CloudinaryStorageAdapter.name,
      portName: 'IAssetStorageService',
      serviceName: 'cloudinary',
      resourceId: publicId,
    };

    try {
      const url = this.cloudinaryInstance.url(publicId);
      return Either.makeRight(url);
    } catch (error) {
      const errorData = this.errorMapper.toErrorData(error, context);
      return Either.makeLeft(errorData);
    }
  }
}