// src/media/infrastructure/nest-js/media.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAssetCommand } from 'src/media/application/commands/upload-asset/upload-asset.command';
import { File } from 'multer';

@Controller('media')
export class MediaController { 
    constructor(private readonly commandBus: CommandBus) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAsset(@UploadedFile() file: File): Promise<{ assetId: string }> { 
        if (!file) {
            throw new HttpException('No se proporcionó ningún archivo', HttpStatus.BAD_REQUEST);
        }
        
        // Solo los 3 datos esenciales
        const command = new UploadAssetCommand(
            file.buffer,
            file.mimetype,
            file.originalname
        );
        
        const result = await this.commandBus.execute(command);
        
        // Manejar Either directamente
        if (result.isLeft()) {
            const error = result.getLeft();
            
            if (error.type === 'InvalidFile') {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            }
            if (error.type === 'CloudinaryError') {
                throw new HttpException('Error subiendo a Cloudinary', HttpStatus.SERVICE_UNAVAILABLE);
            }
            if (error.type === 'DatabaseError') {
                throw new HttpException('Error guardando metadatos', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            
            throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        const assetId = result.getRight();
        return { assetId };
    }
}