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
import { AssetMetadataUrlService } from '../application/ports/asset-metadata-url.service';
import { AssetIdToUrlService } from '../application/ports/asset-id-to.url.service';

const AssetStorageServiceToken = 'IAssetStorageService';
const CryptoServiceToken = 'ICryptoService';
const AssetUrlServiceToken = 'IAssetIdToUrlService';

Module({
    controllers: [MediaController],
    imports: [
        CqrsModule,
        CoreModule,
        ConfigModule.forFeature(() => ({
             // ... configuración de Cloudinary
        })),
        // Importa y registra el DAO necesario
        DaoFactoryModule.forFeature(DaoName.AssetMetadataMongo),
    ],
    providers: [
        UploadAssetHandler,
        // Configuración de Cloudinary
        { provide: 'CLOUDINARY_CONFIG', useFactory: () => { /* ... cloudinary.config ... */ return cloudinary; } },
        { provide: AssetStorageServiceToken, useClass: CloudinaryStorageAdapter },
        { provide: CryptoServiceToken, useClass: NodeCryptoService },
        { provide: 'IAssetUrl', useClass: CloudinaryUrlGeneratorAdapter },
        { provide: 'IdGenerator', useExisting: UuidGenerator },
        CloudinaryUrlGeneratorAdapter,
        UuidGenerator, // Asegúrate de proveerlo si otros servicios dependen de él
        
        // El servicio que implementa IAssetIdToUrlService y usa el DAO
        AssetIdToUrlService,
        // Provee el token de la interfaz usando el servicio concreto
        { 
            provide: AssetStorageServiceToken,
            useExisting: AssetMetadataUrlService, 
        },
    ],
    exports: [
        // Exportamos el proveedor del DAO (mediante el Factory Module)
        DaoFactoryModule.forFeature(DaoName.AssetMetadataMongo),
        
        // Exportamos el servicio de URL para que KahootsModule pueda inyectarlo
        AssetMetadataUrlService, 
        AssetUrlServiceToken, // Exportamos también el token (IAssetIdToUrlService)
        
        // Otros exports si son necesarios para KahootsModule
        AssetStorageServiceToken,
        CryptoServiceToken,
    ]
})
export class MediaModule {}