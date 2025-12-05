import { Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import { IAssetStorageService } from 'src/media/application/ports/asset-storage/i-asset-storage.service';
import { Either } from 'src/core/types/either';
import {
  CloudinaryError,
  CloudinaryErrorMapper,
  isCloudinaryDuplicateError
} from './errors';

@Injectable()
export class CloudinaryService implements IAssetStorageService {
  constructor() {
    try {
      cloudinary.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    } catch (configError) {
      console.error('Error configurando Cloudinary:', configError);
    }
  }

  // --- Métodos de la Interfaz IAssetStorageService ---

  async uploadAndDeduplicate(fileBuffer: Buffer, hash: string): Promise<Either<CloudinaryError, string>> {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            public_id: hash,
            overwrite: false,
            resource_type: 'auto',
            folder: process.env.CLOUDINARY_ASSET_FOLDER || 'quizzy_assets',
          },
          (error, result) => {
            if (error) {
              // Duplicidad no es error, es éxito
              if (error.http_code === 400 && error.message.includes('already exists')) {
                resolve({ public_id: hash });
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

      return Either.makeRight(result.public_id);

    } catch (error) {
      const cloudinaryError = CloudinaryErrorMapper.mapUploadError(error, {
        hash,
        operation: 'upload'
      });
      return Either.makeLeft(cloudinaryError);
    }
  }

  generateUrl(publicId: string): string {
    return cloudinary.v2.url(publicId, { secure: true });
  }

  async deleteAsset(publicId: string): Promise<Either<CloudinaryError, void>> {
    try {
      await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'auto' });
      return Either.makeRight(undefined);
    } catch (error) {
      const cloudinaryError = CloudinaryErrorMapper.mapDeleteError(error, {
        publicId,
        operation: 'delete'
      });
      return Either.makeLeft(cloudinaryError);
    }
  }
}