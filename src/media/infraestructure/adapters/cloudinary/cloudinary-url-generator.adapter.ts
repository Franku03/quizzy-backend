// src/media/infrastructure/cloudinary/cloudinary-url-generator.adapter.ts

import { Injectable, Inject } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import { IAssetUrlService } from 'src/media/application/ports/asset-url-generator.interface';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IExternalServiceErrorContext } from 'src/core/errors/interface/context/i-extenral-service.context';
import { CLOUDINARY_CONFIG } from 'src/media/application/dependecy-tokkens/application-media.tokens';

@Injectable()
export class CloudinaryUrlGeneratorAdapter implements IAssetUrlService {
  private readonly adapterContext: IExternalServiceErrorContext = {
    operation: 'generate-url',
    adapterName: CloudinaryUrlGeneratorAdapter.name,
    portName: 'IAssetUrlService',
    serviceName: 'cloudinary',
  };

  constructor(
    @Inject(CLOUDINARY_CONFIG) 
    private readonly cloudinaryInstance: typeof cloudinary.v2
  ) {}

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
      try {
        this.validateProvider(asset.provider, asset.publicId);
        const url = this.cloudinaryInstance.url(asset.publicId, {
          secure: true,
          sign_url: options?.signed || false,
          expires_at: options?.expiresIn ? Math.floor(Date.now() / 1000) + options.expiresIn : undefined,
          ...options?.transformations,
        });
        urlMap.set(asset.publicId, url);
      } catch (error) {
        // Si un asset falla, seguimos con los demás
        console.debug(`Failed to generate URL for ${asset.publicId}:`, error);
      }
    }
    
    return urlMap;
  }

  private validateProvider(provider: string, publicId: string): void {
    if (provider !== 'cloudinary') {
      const errorContext: IExternalServiceErrorContext = {
        ...this.adapterContext,
        resourceId: publicId,
        invalidProvider: provider,
      };

      throw new ErrorData(
        "PROVIDER_MISMATCH",
        `Provider ${provider} not supported by Cloudinary URL generator`,
        ErrorLayer.APPLICATION,
        errorContext
      );
    }
  }
}