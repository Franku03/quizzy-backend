// src/media/infrastructure/nest-js/media.controller.ts (Nota: Ruta renombrada)

import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAssetCommand } from 'src/media/application/commands/upload-asset/upload-asset.command';

// 💡 SOLUCIÓN: Importar el tipo File directamente de Express
// Esto hace que el tipo Express.Multer.File sea reconocido.
import { File } from 'multer'; 

@Controller('media') // Renombrado de 'assets' a 'media'
export class MediaController { 
    constructor(private readonly commandBus: CommandBus) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAsset(@UploadedFile() file: File): Promise<{ assetId: string }> { 
        if (!file) {
            throw new HttpException('No se proporcionó ningún archivo en el campo "file".', HttpStatus.BAD_REQUEST);
        }
        
        // El tipo File ahora es reconocido y su estructura contiene buffer y mimetype.
        const command = new UploadAssetCommand(file.buffer, file.mimetype);
        
        // Ejecutar el handler y obtener el UUID (publicId)
        const assetId: string = await this.commandBus.execute(command); 
        
        return { assetId }; // Devuelve el UUID al cliente para que Kahoot lo guarde
    }
}