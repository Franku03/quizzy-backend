/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\queries\get-themes\get-themes.proxy.ts

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAssetCommand } from 'src/media/application/commands/upload-asset/upload-asset.command';
import { UploadAssetResponse } from 'src/media/application/dtos/upload-asset.response.dto';
import { GetThemesQuery } from 'src/media/application/queries/get-themes/get-themes.query';
import { ThemeResponse } from 'src/media/application/dtos/theme.response.dto';
import { GetThemesDTO } from 'src/media/infrastructure/dtos/get-themes.dto';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { CommandBus } from 'src/core/infrastructure/cqrs/buses/command-bus';
import { QueryBus } from 'src/core/infrastructure/cqrs/buses/query-bus';
import { Either, ErrorData, ErrorLayer } from 'src/core/types';

interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Controller('media')
export class MediaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('upload')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(
    @UploadedFile() file?: MulterFile,
  ): Promise<Either<ErrorData, UploadAssetResponse>> {
    if (!file) {
      return Either.makeLeft(
        new ErrorData(
          'MISSING_FILE',
          'No file was provided for upload',
          ErrorLayer.INFRASTRUCTURE,
        ),
      );
    }

    const command = new UploadAssetCommand(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    return (await this.commandBus.execute(command)) as Either<
      ErrorData,
      UploadAssetResponse
    >;
  }

  @Get('themes')
  async getThemes(
    @Query() params: GetThemesDTO,
  ): Promise<Either<ErrorData, ThemeResponse[]>> {
    const query = new GetThemesQuery(params);
    return (await this.queryBus.execute(query)) as Either<
      ErrorData,
      ThemeResponse[]
    >;
  }
}
