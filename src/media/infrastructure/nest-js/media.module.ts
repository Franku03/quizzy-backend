import { Module, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

// --- Comandos y Consultas (CQRS) ---
import { UploadAssetHandler } from '../../application/commands/upload-asset/upload-asset.handler';
import { GetThemesHandler } from '../../application/queries/get-themes/get-themes.handler';

// --- Orquestación (Servicios, Factorías y Handlers) ---
import { MediaEnrichmentService } from '../../application/facade/media-enrichment.service';
import { EnrichmentHandlerFactory } from '../../application/factories/enrichment-handler.factory';
import { AssetEnrichmentHandler } from 'src/media/application/handlers/asset-enrichment.handler';
import { ThemeEnrichmentHandler } from 'src/media/application/handlers/theme-enrichement.handler';

// --- Servicios de Resolución y Proxies (Cache) ---
import { AssetResolutionService } from '../../application/services/asset-resolution.service';
import { AssetResolutionProxy } from '../../application/services/asset-resolution.proxy';
import { ThemeResolutionService } from '../../application/services/theme-resolution.service';
import { ThemeResolutionProxy } from '../../application/services/theme-resolution.proxy';
import { ThemeListProxy } from 'src/media/application/queries/get-themes/get-themes.proxy';

// --- Adaptadores e Infraestructura ---
import { CloudinaryStorageAdapter } from '../adapters/cloudinary/cloudinary.storage.adapter';
import { CloudinaryUrlGeneratorAdapter } from '../adapters/cloudinary/cloudinary.url-generator.adapter';
import { CloudinaryErrorMapper } from '../adapters/cloudinary/errors/cloudinary.error.mapper';
import { NodeCryptoService } from 'src/core/infrastructure/adapters/nodecryptoservice/node-crypto.service';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

// --- Tokens y Catálogos ---
import { MEDIA_TOKENS } from '../../application/dependency-tokens/application-media.tokens';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

// --- Módulos Externos ---
import { CoreModule } from 'src/core/core.module';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { MediaController } from './media.controller';

@Module({
    controllers: [MediaController],
    imports: [
        CoreModule,
        ConfigModule,
        DaoFactoryModule.forFeature(DaoName.AssetMetadata),
    ],
    providers: [
        CommandQueryExecutorService,
        UploadAssetHandler,

        // --- Orquestación y Factorías ---
        MediaEnrichmentService,
        EnrichmentHandlerFactory,
        {
            provide: AssetEnrichmentHandler,
            useClass: AssetEnrichmentHandler,
            scope: Scope.TRANSIENT,
        },
        {
            provide: ThemeEnrichmentHandler,
            useClass: ThemeEnrichmentHandler,
            scope: Scope.TRANSIENT,
        },

        // --- API Query Proxies (Listados/Colecciones) ---
        {
            provide: MEDIA_TOKENS.RAW_THEME_LIST_QUERY_HANDLER,
            useClass: GetThemesHandler,
        },

        ThemeListProxy,

        // --- Sistema de Resolución de Imágenes (Proxy Pattern) ---
        {
            provide: MEDIA_TOKENS.RAW_IMAGE_URL_ENRICHER,
            useClass: AssetResolutionService,
        },
        {
            provide: MEDIA_TOKENS.IMAGE_URL_ENRICHER,
            useClass: AssetResolutionProxy, 
        },

        // --- Sistema de Resolución de Temas (Proxy Pattern) ---
        {
            provide: MEDIA_TOKENS.RAW_THEME_ENRICHER,
            useClass: ThemeResolutionService,
        },
        {
            provide: MEDIA_TOKENS.THEME_ENRICHER,
            useClass: ThemeResolutionProxy, 
        },

        // --- Infraestructura y Adaptadores ---
        {
            provide: MEDIA_TOKENS.ASSET_URL_GENERATOR,
            useClass: CloudinaryUrlGeneratorAdapter
        },
        {
            provide: MEDIA_TOKENS.ASSET_STORAGE_SERVICE,
            useClass: CloudinaryStorageAdapter
        },
        {
            provide: ERROR_TOKENS.MAPPERS.CLOUDINARY,
            useClass: CloudinaryErrorMapper
        },
        {
            provide: APPLICATION_CORE_TOKENS.UTILS.CRYPTO_SERVICE,
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
        MediaEnrichmentService,
    ]
})
export class MediaModule { }