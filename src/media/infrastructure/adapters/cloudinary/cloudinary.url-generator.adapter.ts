// src/media/infrastructure/cloudinary/cloudinary-url-generator.adapter.ts
import { Injectable, Inject } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import { IAssetUrlGenerator } from 'src/media/application/ports/i-asset-url-generator.interface';
import { IExternalServiceErrorContext } from 'src/core/errors/interface/context/i-external-service.context';
import {  MEDIA_TOKENS } from 'src/media/application/dependency-tokens/application-media.tokens';

@Injectable()
export class CloudinaryUrlGeneratorAdapter implements IAssetUrlGenerator {

  private readonly adapterContext: IExternalServiceErrorContext = {
    operation: 'generate-url',
    adapterName: CloudinaryUrlGeneratorAdapter.name,
    portName: 'IAssetUrlGenerator',
    serviceName: 'cloudinary',
  };

  constructor(
    @Inject(MEDIA_TOKENS.CLOUDINARY_CONFIG) 
    private readonly cloudinaryInstance: typeof cloudinary.v2
  ) {}

  generateUrl(publicId: string): string {
    return this.cloudinaryInstance.url(publicId, { secure: true });
  }

  generateUrls(publicIds: string[]): Map<string, string> {
    const urlMap = new Map<string, string>();
    
    for (const id of publicIds) {
      const url = this.generateUrl(id);
      urlMap.set(id, url);
    }
    
    return urlMap;
  }
}