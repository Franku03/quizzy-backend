/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\infrastructure\nest-js\media.controller.ts

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
import { UploadAssetResponse } from 'src/media/application/dtos/upload-asset.response.dto';
import { GetThemesQuery } from 'src/media/application/queries/get-themes/get-themes.query';
import { ThemeResponse } from 'src/media/application/dtos/theme.response.dto';
import { GetThemesDTO } from '../dtos/get-themes.dto';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { CommandBus } from 'src/core/infrastructure/cqrs/buses/command-bus';
import { QueryBus } from 'src/core/infrastructure/cqrs/buses/query-bus';

@Controller('media')
export class MediaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    
  ) { }

  @Post('upload')
  @Auth()
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

    return await this.commandBus.execute(command);
  }

  @Get('themes')
  async getThemes(@Query() params: GetThemesDTO): Promise<ThemeResponse[]> {
    const query = new GetThemesQuery(params);
    return await this.queryBus.execute(query);
  }
}