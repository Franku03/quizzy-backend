// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

// Application Layer
import { UploadAssetHandler } from '../application/commands/upload-asset/upload-asset.handler';
import { 
  ASSET_STORAGE_SERVICE,
  CRYPTO_SERVICE,
  ASSET_URL_SERVICE,
  ERROR_MAPPER,
  CLOUDINARY_CONFIG
} from '../application/dependecy-tokkens/application-media.tokens';

// Infrastructure Layer
import { MediaController } from './nest-js/media.controller';
import { CoreModule } from 'src/core/core.module';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { CloudinaryStorageAdapter } from './adapters/cloudinary/cloudinary-storage.adapter';
import { NodeCryptoService } from 'src/core/infrastructure/adapters/node-crypto.service';
import { CloudinaryUrlGeneratorAdapter } from './adapters/cloudinary/cloudinary-url-generator.adapter';
import { CloudinaryErrorMapper } from './adapters/cloudinary/errors/cloudinary-error.mapper';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';
import { GetThemesHandler } from '../application/queries/get-themes/get-themes.handler';

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
        { 
            provide: CLOUDINARY_CONFIG,
            useFactory: () => { 
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                });
                return cloudinary; 
            } 
        },
        // Mapea Error a La clase ErrorBase
        { provide: ERROR_MAPPER, useClass: CloudinaryErrorMapper },
        // Se encarga del upload / Delete 
        { provide: ASSET_STORAGE_SERVICE, useClass: CloudinaryStorageAdapter },
        // Se encarga de Hashear la imagen
        { provide: CRYPTO_SERVICE, useClass: NodeCryptoService }, 
        // Se encarga de convertir un ID -> Url
        // Usado por el anterior porque consulta el DAO para buscar la referencia exacta y devolver
        { provide: ASSET_URL_SERVICE, useClass: CloudinaryUrlGeneratorAdapter },
    ],
    exports: [
        DaoFactoryModule.forFeature(DaoName.AssetMetadataMongo),
        ASSET_URL_SERVICE,
    ]
})
export class MediaModule {}