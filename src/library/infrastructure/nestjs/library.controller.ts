/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationDto } from './dtos/pagination.dto';
import { GetDraftsAndCreatedKahootsQuery } from '../../application/queries/get-drafts-and-created-kahoots/get-drafts-and-created-kahoots.query';
import { PaginationMapper } from './mapper/pagination.mapper';
import { Either } from 'src/core/types/either';
import { LibraryReadModel } from 'src/library/application/queries/read-model/library.read.model';
import { GetFavoritesQuery } from '../../application/queries/get-favorite-kahoots/get-favorites.query';
import { CheckIfCanBeSavedToFavoritesQuery } from 'src/library/application/queries/check-if-can-be-saved-to-favorites/check-if-can-be-saved-to-favorites.query';
import { Optional } from 'src/core/types/optional';
import { GetCompletedKahootsQuery } from '../../application/queries/get-completed-kahoots/get-completed-kahoots.query';
import { GetInProgressKahootsQuery } from '../../application/queries/get-in-progress-kahoots/get-in-progress-kahoots.query';
import { AddKahootToFavoritesCommand } from 'src/library/application/commands/add-kahoot-to-favorites/add-kahoot-to-favorites.command';
import { RemoveKahootFromFavoritesCommand } from '../../application/commands/remove-kahoot-from-favorites/remove-kahoot-from-favorites.command';
import { MockAuthGuard } from 'src/common/infrastructure/guards/mock-auth-guard';
import { CommandBus } from 'src/core/infrastructure/cqrs/buses/command-bus';
import { QueryBus } from 'src/core/infrastructure/cqrs/buses/query-bus';
import { ErrorData } from 'src/core/types';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';

// TODO: agregar autenticacion
@Controller('library')
export class LibraryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Query (CQRS) H7.1
  @HttpCode(200)
  @Auth()
  @Get('my-creations')
  async getDraftsAndCreatedKahoots(
    @Query() paginationDto: PaginationDto,
    @GetUserId() userId: string,
  ) {
    const response: Either<ErrorData, LibraryReadModel> =
      await this.queryBus.execute(
        PaginationMapper.toQuery(
          paginationDto,
          userId,
          GetDraftsAndCreatedKahootsQuery,
        ),
      );
    if (response.isLeft()) throw response.getLeft();
    return response.getRight().toJson();
  }

  // Query (CQRS) H7.2
  @HttpCode(200)
  @Auth()
  @Get('favorites')
  async getFavorites(
    @Query() paginationDto: PaginationDto,
    @GetUserId() userId: string,
  ) {
    const response: Either<ErrorData, LibraryReadModel> =
      await this.queryBus.execute(
        PaginationMapper.toQuery(paginationDto, userId, GetFavoritesQuery),
      );
    if (response.isLeft()) throw response.getLeft();
    return response.getRight().toJson();
  }

  // query + command (CQRS) H7.3
  @HttpCode(201)
  @Auth()
  @Post('favorites/:kahootId')
  async addKahootTofavorites(
    @Param('kahootId') kahootId: string,
    @GetUserId() userId: string,
  ) {
    const kahootExistanceOptional: Optional<ErrorData> =
      await this.queryBus.execute(
        new CheckIfCanBeSavedToFavoritesQuery(kahootId),
      );
    if (kahootExistanceOptional.hasValue())
      throw kahootExistanceOptional.getValue();
    const res: Optional<ErrorData> = await this.commandBus.execute(
      new AddKahootToFavoritesCommand(userId, kahootId),
    );
    if (res.hasValue()) throw res.getValue();
  }

  // command (CQRS) H7.4 - TODO: Mejorar manejo de errores de comandos
  @HttpCode(204)
  @Auth()
  @Delete('favorites/:kahootId')
  async deleteKahootFromfavorites(
    @Param('kahootId') kahootId: string,
    @GetUserId() userId: string,
  ) {
    const res: Optional<ErrorData> = await this.commandBus.execute(
      new RemoveKahootFromFavoritesCommand(userId, kahootId),
    );
    if (res.hasValue()) throw res.getValue();
  }

  // Query (CQRS) H7.5
  @HttpCode(200)
  @Auth()
  @Get('in-progress')
  async getInProgressKahoots(
    @Query() paginationDto: PaginationDto,
    @GetUserId() userId: string,
  ) {
    const response: Either<ErrorData, LibraryReadModel> =
      await this.queryBus.execute(
        PaginationMapper.toQuery(
          paginationDto,
          userId,
          GetInProgressKahootsQuery,
        ),
      );
    if (response.isLeft()) throw response.getLeft();
    return response.getRight().toJson();
  }

  // Query (CQRS) H7.6
  @HttpCode(200)
  @Auth()
  @Get('completed')
  async getCompletedKahoots(
    @Query() paginationDto: PaginationDto,
    @GetUserId() userId: string,
  ) {
    const response: Either<ErrorData, LibraryReadModel> =
      await this.queryBus.execute(
        PaginationMapper.toQuery(
          paginationDto,
          userId,
          GetCompletedKahootsQuery,
        ),
      );
    if (response.isLeft()) throw response.getLeft();
    return response.getRight().toJson();
  }

  /*
  private handleError(errorData: ErrorData) {
    throw new HttpException(
      `${errorData.layer}: ${errorData.message}`, // capa de error + mensaje
      Number(errorData.code), //codigo http
    );
  }
  */
}
