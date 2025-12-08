// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadAssetHandler } from '../application/commands/upload-asset/upload-asset.handler';
import { MediaController } from './nest-js/media.controller';
import { CoreModule } from 'src/core/core.module';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { CloudinaryStorageAdapter } from './adapters/cloudinary/cloudinary-storage.adapter';
import { NodeCryptoService } from 'src/core/infrastructure/adapters/node-crypto.service';
import { CloudinaryUrlGeneratorAdapter } from './adapters/cloudinary/cloudinary-url-generator.adapter';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { AssetIdToUrlService } from '../application/services/asset-id-to.url.service';
import { CloudinaryErrorMapper } from './adapters/cloudinary/errors/cloudinary-error.mapper';

const AssetStorageServiceToken = 'IAssetStorageService';
const CryptoServiceToken = 'ICryptoService';
const AssetIdToUrlServiceToken = 'IAssetIdToUrlService'; 
const ErrorMapperToken = 'IErrorMapper';
const AssetUrlServiceToken = 'IAssetUrlService';


@Module({
    controllers: [MediaController],
    imports: [
        CqrsModule,
        CoreModule,
        ConfigModule.forFeature(() => ({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        })),
        DaoFactoryModule.forFeature(DaoName.AssetMetadataMongo),
    ],
    providers: [
        UploadAssetHandler,
        { 
            provide: 'CLOUDINARY_CONFIG', 
            useFactory: () => { 
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                });
                return cloudinary; 
            } 
        },
        //Mapea Error a La clase ErrorBase
        { provide: ErrorMapperToken, useClass: CloudinaryErrorMapper },
        //Se encarga del upload / Delete 
        { provide: AssetStorageServiceToken, useClass: CloudinaryStorageAdapter },
        //Se encarga de Hashear la imagen
        { provide: CryptoServiceToken, useClass: NodeCryptoService }, 
        //Se encarga de generar el uuid
        { provide: 'IdGenerator', useExisting: UuidGenerator },
        //Se encarga de convertir un ID -> Url
        { provide: AssetIdToUrlServiceToken, useClass: AssetIdToUrlService, },
        //Usado por el anterior porque consulta el DAO para buscar la referencia exacta y devolver
        { provide: AssetUrlServiceToken, useClass: CloudinaryUrlGeneratorAdapter,},
    ],
    exports: [
        DaoFactoryModule.forFeature(DaoName.AssetMetadataMongo),
        AssetIdToUrlServiceToken,
    ]
})
export class MediaModule {}