// src/media/infrastructure/cloudinary/cloudinary-storage.adapter.ts
import { Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import { IAssetStorageService } from 'src/media/application/ports/asset-storage.service';
import { Either } from 'src/core/types/either';
import { StorageError } from '../../errors/storage.error';
import { CloudinaryErrorFactory } from '../errors/cloudinary/cloudinary-error.factory';

@Injectable()
export class CloudinaryStorageAdapter implements IAssetStorageService {
  constructor() {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
    publicId: string
  ): Promise<Either<StorageError, { publicId: string; provider: string }>> {
    try {
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      if (mimeType.startsWith('image/')) {
        resourceType = 'image';
      } else if (mimeType.startsWith('video/')) {
        resourceType = 'video';
      } else if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
        resourceType = 'raw';
      }

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            public_id: publicId,
            overwrite: false,
            resource_type: resourceType,
            folder: process.env.CLOUDINARY_ASSET_FOLDER || 'quizzy_assets',
            type: 'upload',
          },
          (error, result) => {
            if (error) {
              if (error.http_code === 400 && error.message.includes('already exists')) {
                resolve({ public_id: publicId });
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
      const cloudinaryError = CloudinaryErrorFactory.uploadError(error, {
        publicId,
        storageKey: publicId,
        folder: process.env.CLOUDINARY_ASSET_FOLDER,
      });
      return Either.makeLeft(cloudinaryError);
    }
  }

  async delete(publicId: string, provider: string): Promise<Either<StorageError, void>> {
    try {
      if (provider !== 'cloudinary') {
        throw new Error(`Provider mismatch: expected 'cloudinary', got '${provider}'`);
      }

      await cloudinary.v2.uploader.destroy(publicId, { 
        resource_type: 'auto' 
      });
      
      return Either.makeRight(undefined);
    } catch (error) {
      const cloudinaryError = CloudinaryErrorFactory.deleteError(error, {
        storageKey: publicId,
      });
      return Either.makeLeft(cloudinaryError);
    }
  }
}