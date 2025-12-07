// src/media/infrastructure/cloudinary/cloudinary-url-generator.adapter.ts
import { Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import { IAssetUrlService } from 'src/media/application/ports/asset-url-generator.interface';

@Injectable()
export class CloudinaryUrlGeneratorAdapter implements IAssetUrlService {
  constructor() {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Método para un solo asset
  generateUrl(
    provider: string, 
    publicId: string,
    options?: {
      signed?: boolean;
      expiresIn?: number;
      transformations?: Record<string, any>;
    }
  ): string {
    if (provider !== 'cloudinary') {
      throw new Error(`Provider ${provider} not supported by Cloudinary URL generator`);
    }

    return cloudinary.v2.url(publicId, {
      secure: true,
      sign_url: options?.signed || false,
      expires_at: options?.expiresIn ? Math.floor(Date.now() / 1000) + options.expiresIn : undefined,
      ...options?.transformations,
    });
  }

  // Método para múltiples assets
  generateUrls(
    assets: Array<{ provider: string; publicId: string }>,
    options?: {
      signed?: boolean;
      expiresIn?: number;
      transformations?: Record<string, any>;
    }
  ): Map<string, string> {
    const urlMap = new Map<string, string>();
    
    for (const asset of assets) {
      if (asset.provider !== 'cloudinary') {
        throw new Error(`Provider ${asset.provider} not supported by Cloudinary URL generator`);
      }
      
      const url = this.generateUrl(asset.provider, asset.publicId, options);
      urlMap.set(asset.publicId, url);
    }
    
    return urlMap;
  }
}