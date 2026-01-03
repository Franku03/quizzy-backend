// src/media/infrastructure/nest-js/media.controller.ts

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Get,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAssetCommand } from 'src/media/application/commands/upload-asset/upload-asset.command';
import { File } from 'multer';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';
import { UploadAssetResponse } from 'src/media/application/dtos/upload-asset.response.dto';
import { GetThemesQuery } from 'src/media/application/queries/get-themes/get-themes.query';
import { ThemeResponse } from 'src/media/application/dtos/theme.response.dto';
import { GetThemesDTO } from '../dtos/get-themes.dto';

@Controller('media')
export class MediaController {
  constructor(
    private readonly executor: CommandQueryExecutorService
  ) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(@UploadedFile() file: File): Promise<UploadAssetResponse> {
    if (!file) {
      throw new HttpException('No se proporcionó ningún archivo', HttpStatus.BAD_REQUEST);
    }

    const command = new UploadAssetCommand(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    return await this.executor.executeCommand<UploadAssetResponse>(command);
  }

  @Get('themes')
    async getThemes(@Query() params: GetThemesDTO): Promise<ThemeResponse[]> {
        const query = new GetThemesQuery(params);
        return await this.executor.executeQuery<ThemeResponse[]>(query);
    }
}