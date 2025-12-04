// src/multimedia/infrastructure/adapters/cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import { IAssetStorageService } from 'src/media/application/ports/asset-storage/i-asset-storage.service';

@Injectable()
export class CloudinaryService implements IAssetStorageService {
    
    // Configuración asumida de Cloudinary (debe estar cargada desde ConfigModule)
    constructor() {
        cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    // --- Métodos de la Interfaz IAssetStorageService ---

    async uploadAndDeduplicate(fileBuffer: Buffer, hash: string): Promise<string> {
        // La deduplicación se gestiona intentando subir el archivo con el hash como public_id
        // y overwrite: false. Si falla por duplicado, devolvemos el hash existente.
        try {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.v2.uploader.upload_stream(
                    {
                        public_id: hash,       // Usar el hash como ID de contenido
                        overwrite: false,      // Evita la sobrescritura si ya existe (clave para deduplicación)
                        resource_type: 'auto', // Soporta imagen, video, etc.
                        folder: process.env.CLOUDINARY_ASSET_FOLDER || 'quizzy_assets',
                    },
                    (error, result) => {
                        if (error) {
                            // Manejamos el error específico de duplicación (ej. code 400 'already exists')
                            if (error.http_code === 400 && error.message.includes('already exists')) {
                                resolve({ public_id: hash, isDuplicate: true });
                            } else {
                                reject(error);
                            }
                        } else {
                            resolve(result);
                        }
                    }
                );
                uploadStream.end(fileBuffer);
            }) as any;

            return result.public_id; // Devuelve el hash/public_id (ya sea nuevo o duplicado)

        } catch (error) {
            console.error('Error al subir a Cloudinary:', error);
            throw new Error('Fallo la operación de Cloudinary.');
        }
    }

    generateUrl(publicId: string): string {
        // Genera la URL pública a partir del public_id (que es el hash)
        return cloudinary.v2.url(publicId, { secure: true });
    }

    async deleteAsset(publicId: string): Promise<void> {
        // Elimina el activo de Cloudinary
        await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'auto' });
    }
}