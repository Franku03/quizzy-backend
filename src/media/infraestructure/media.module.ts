import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { UploadAssetHandler } from '../application/commands/upload-asset/upload-asset.handler';
import { NodeCryptoService } from 'src/core/infrastructure/adapters/node-crypto.service';
import { CloudinaryService } from './adapters/cloudinary.service';
import { MediaController } from './nest-js/media.controller';
import { CoreModule } from 'src/core/core.module';
import { GetAssetUrlQueryHandler } from '../application/queries/get-asset-url/get-asset-url-by-id.handler';

const AssetStorageServiceToken = 'IAssetStorageService';
const CryptoServiceToken = 'ICryptoService';

@Module({
    controllers: [MediaController],
    imports: [
        CqrsModule,
        CoreModule,
        ConfigModule.forFeature(() => ({
            cloudinary: {
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                apiKey: process.env.CLOUDINARY_API_KEY,
                apiSecret: process.env.CLOUDINARY_API_SECRET,
            },
        })),
        RepositoryFactoryModule.forFeature(RepositoryName.FileMetadata),
    ],
    providers: [
        UploadAssetHandler,
        GetAssetUrlQueryHandler,
        {
            provide: CryptoServiceToken,
            useClass: NodeCryptoService,
        },
        {
            provide: AssetStorageServiceToken,
            useClass: CloudinaryService,
        },
        // Configuración de Cloudinary
        {
            provide: 'CLOUDINARY_CONFIG',
            useFactory: () => {
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                });
                return cloudinary;
            },
        },
    ],
    exports: [
        AssetStorageServiceToken,
        CryptoServiceToken,
        RepositoryFactoryModule.forFeature(RepositoryName.FileMetadata),
    ]
})
export class MediaModule {}
