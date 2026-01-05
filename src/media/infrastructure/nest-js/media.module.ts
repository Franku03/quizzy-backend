// src/media/infrastructure/nestjs/media.module.ts
import { Module, Scope } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import { UploadAssetHandler } from '../../application/commands/upload-asset/upload-asset.handler';
import { GetThemesHandler } from '../../application/queries/get-themes/get-themes.handler';
import { MediaEnrichmentService } from '../../application/facade/media-enrichment.service';
import { EnrichmentHandlerFactory } from '../../application/factories/enrichment-handler.factory';
import { AssetResolutionService } from '../../application/services/asset-resolution.service';
import { ThemeResolutionService } from '../../application/services/theme-resolution.service';
import { MEDIA_TOKENS } from '../../application/dependency-tokens/application-media.tokens';

import { MediaController } from './media.controller';
import { CoreModule } from 'src/core/core.module';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { CloudinaryStorageAdapter } from '../adapters/cloudinary/cloudinary.storage.adapter';
import { CloudinaryUrlGeneratorAdapter } from '../adapters/cloudinary/cloudinary.url-generator.adapter';
import { NodeCryptoService } from 'src/core/infrastructure/adapters/node-crypto.service';
import { CloudinaryErrorMapper } from '../adapters/cloudinary/errors/cloudinary.error.mapper';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

// Handlers
import { UrlEnrichmentHandler } from '../../application/handlers/url-enrichment.handler';
import { ThemeEnrichmentHandler } from 'src/media/application/handlers/theme-enrichemnt.handler';

@Module({
    controllers: [MediaController],
    imports: [
        CqrsModule,
        CoreModule,
        ConfigModule,
        DaoFactoryModule.forFeature(DaoName.AssetMetadataMongo),
    ],
    providers: [
        CommandQueryExecutorService,
        UploadAssetHandler,
        GetThemesHandler,
        MediaEnrichmentService,
        EnrichmentHandlerFactory,
        // Registro de Handlers con SCOPE TRANSIENT (10/10 SOLID)
        {
            provide: UrlEnrichmentHandler,
            useClass: UrlEnrichmentHandler,
            scope: Scope.TRANSIENT,
        },
        {
            provide: ThemeEnrichmentHandler,
            useClass: ThemeEnrichmentHandler,
            scope: Scope.TRANSIENT,
        },
        {
            provide: MEDIA_TOKENS.IMAGE_URL_ENRICHER,
            useClass: AssetResolutionService
        },
        {
            provide: MEDIA_TOKENS.THEME_ENRICHER,
            useClass: ThemeResolutionService
        },
        {
            provide: MEDIA_TOKENS.ASSET_URL_GENERATOR,
            useClass: CloudinaryUrlGeneratorAdapter
        },
        {
            provide: MEDIA_TOKENS.ERROR_MAPPER,
            useClass: CloudinaryErrorMapper
        },
        {
            provide: MEDIA_TOKENS.ASSET_STORAGE_SERVICE,
            useClass: CloudinaryStorageAdapter
        },
        {
            provide: MEDIA_TOKENS.CRYPTO_SERVICE,
            useClass: NodeCryptoService
        },
        {
            provide: MEDIA_TOKENS.CLOUDINARY_CONFIG,
            useFactory: () => {
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                });
                return cloudinary;
            }
        },
    ],
    exports: [
        DaoFactoryModule,
        MediaEnrichmentService,
    ]
})
export class MediaModule { }