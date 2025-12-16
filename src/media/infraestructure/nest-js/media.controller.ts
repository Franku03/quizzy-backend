// src/media/infrastructure/nest-js/media.controller.ts

import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAssetCommand } from 'src/media/application/commands/upload-asset/upload-asset.command';
import { File } from 'multer';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

@Controller('media')
export class MediaController { 
    constructor(
      private readonly executor: CommandQueryExecutorService
    ) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAsset(@UploadedFile() file: File): Promise<{ assetId: string }> { 
        if (!file) {
            throw new HttpException('No se proporcionó ningún archivo', HttpStatus.BAD_REQUEST);
        }
        
        const command = new UploadAssetCommand(
            file.buffer,
            file.mimetype,
            file.originalname
        );
        
        const assetId = await this.executor.executeCommand<string>(command);
        
        return { assetId };
    }
}