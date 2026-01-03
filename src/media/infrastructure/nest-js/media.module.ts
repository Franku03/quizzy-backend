// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

// Application Layer - Commands & Queries
import { UploadAssetHandler } from '../../application/commands/upload-asset/upload-asset.handler';
import { GetThemesHandler } from '../../application/queries/get-themes/get-themes.handler';

// Application Layer - Facade & Enrichers
import { MediaEnrichmentService } from '../../application/facade/media-enrichment.service';
import { KahootMediaEnricher } from '../../application/enrichers/kahoot-media.enricher';
import { SlideMediaEnricher } from '../../application/enrichers/slide-media.enricher';
import { StylingMediaEnricher } from '../../application/enrichers/styling-media.enricher';
import { OptionMediaEnricher } from '../../application/enrichers/option-media.enricher';

// Application Layer - Services (Resolvers)
import { AssetResolutionService } from '../../application/services/asset-resolution.service';
import { ThemeResolutionService } from '../../application/services/theme-resolution.service';

// Tokens
import { MEDIA_TOKENS } from '../../application/dependency-tokens/application-media.tokens';

// Infrastructure Layer
import { MediaController } from './media.controller';
import { CoreModule } from 'src/core/core.module';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { CloudinaryStorageAdapter } from '../adapters/cloudinary/cloudinary.storage.adapter';
import { CloudinaryUrlGeneratorAdapter } from '../adapters/cloudinary/cloudinary.url-generator.adapter';
import { NodeCryptoService } from 'src/core/infrastructure/adapters/node-crypto.service';
import { CloudinaryErrorMapper } from '../adapters/cloudinary/errors/cloudinary.error.mapper';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

@Module({
    controllers: [MediaController],
    imports: [
        CqrsModule,
        CoreModule,
        ConfigModule,
        DaoFactoryModule.forFeature(DaoName.AssetMetadataMongo),
    ],
    providers: [
        // =================================================================
        // 1. HANDLERS (CQRS)
        // =================================================================
        CommandQueryExecutorService,
        UploadAssetHandler,
        GetThemesHandler,

        // =================================================================
        // 2. ARQUITECTURA DE ENRIQUECIMIENTO (CORE)
        // =================================================================

        // A. Facade (Punto de entrada)
        MediaEnrichmentService,

        // B. Enrichers (Implementaciones de Interfaces)
        {
            provide: MEDIA_TOKENS.KAHOOT_MEDIA_ENRICHER,
            useClass: KahootMediaEnricher,
        },
        {
            provide: MEDIA_TOKENS.SLIDE_MEDIA_ENRICHER,
            useClass: SlideMediaEnricher,
        },
        {
            provide: MEDIA_TOKENS.STYLING_MEDIA_ENRICHER,
            useClass: StylingMediaEnricher,
        },
        {
            provide: MEDIA_TOKENS.OPTION_MEDIA_ENRICHER,
            useClass: OptionMediaEnricher,
        },

        // =================================================================
        // 3. SERVICIOS DE APLICACIÓN (RESOLVERS)
        // =================================================================
        {
            provide: MEDIA_TOKENS.IMAGE_URL_ENRICHER,
            useClass: AssetResolutionService
        },
        {
            provide: MEDIA_TOKENS.THEME_ENRICHER,
            useClass: ThemeResolutionService
        },

        // =================================================================
        // 4. INFRAESTRUCTURA (ADAPTERS)
        // =================================================================
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

        // Configuración de Cloudinary
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