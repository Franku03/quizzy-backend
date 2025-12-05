import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
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
import { GetUserId } from '../../../common/decorators/get-user-id-decorator';

// TODO: agregar autenticacion
@Controller('library')
export class LibraryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Query (CQRS) H7.1
  @HttpCode(200)
  @UseGuards(MockAuthGuard)
  @Get('my-creations')
  async getDraftsAndCreatedKahoots(
    @Query() paginationDto: PaginationDto,
    @GetUserId() userId: string,
  ) {
    const response: Either<Error, LibraryReadModel> =
      await this.queryBus.execute(
        PaginationMapper.toQuery(
          paginationDto,
          userId,
          GetDraftsAndCreatedKahootsQuery,
        ),
      );
    if (response.isLeft()) this.handleGenericErrors(response.getLeft());
    return response.getRight().toJson();
  }

  // Query (CQRS) H7.2
  @HttpCode(200)
  @UseGuards(MockAuthGuard)
  @Get('favorites')
  async getFavorites(@Query() paginationDto: PaginationDto,
    @GetUserId() userId: string,
  ) {
    const response: Either<Error, LibraryReadModel> =
      await this.queryBus.execute(
        PaginationMapper.toQuery(paginationDto, userId, GetFavoritesQuery),
      );
    if (response.isLeft()) this.handleGenericErrors(response.getLeft());
    return response.getRight().toJson();
  }

  // query + command (CQRS) H7.3
  @HttpCode(201)
  @UseGuards(MockAuthGuard)
  @Post('favorites/:kahootId')
  async addKahootTofavorites(@Param('kahootId') kahootId: string,
    @GetUserId() userId: string,
  ) {
    const kahootExistanceOptional: Optional<Error> =
      await this.queryBus.execute(
        new CheckIfCanBeSavedToFavoritesQuery(kahootId),
      );
    if (kahootExistanceOptional.hasValue()) this.handleNotFoundError();
    const res: Optional<Error> = await this.commandBus.execute(
      new AddKahootToFavoritesCommand(userId, kahootId),
    );
    if (res.hasValue()) this.handleAddKahootToFavoritesError(res.getValue());
  }

  // command (CQRS) H7.4
  @HttpCode(204)
  @UseGuards(MockAuthGuard)
  @Delete('favorites/:kahootId')
  async deleteKahootFromfavorites(@Param('kahootId') kahootId: string,
    @GetUserId() userId: string,
  ) {
    const res: Optional<Error> = await this.commandBus.execute(
      new RemoveKahootFromFavoritesCommand(userId, kahootId),
    );
    if (res.hasValue())
      this.handleRemoveKahootFromFavoritesError(res.getValue());
  }

  // Query (CQRS) H7.5
  @HttpCode(200)
  @UseGuards(MockAuthGuard)
  @Get('in-progress')
  async getInProgressKahoots(@Query() paginationDto: PaginationDto,
    @GetUserId() userId: string,
  ) {
    const response: Either<Error, LibraryReadModel> =
      await this.queryBus.execute(
        PaginationMapper.toQuery(
          paginationDto,
          userId,
          GetInProgressKahootsQuery,
        ),
      );
    if (response.isLeft()) this.handleGenericErrors(response.getLeft());
    return response.getRight().toJson();
  }

  // Query (CQRS) H7.6
  @HttpCode(200)
  @UseGuards(MockAuthGuard)
  @Get('completed')
  async getCompletedKahoots(@Query() paginationDto: PaginationDto,
    @GetUserId() userId: string,
  ) {
    const response: Either<Error, LibraryReadModel> =
      await this.queryBus.execute(
        PaginationMapper.toQuery(
          paginationDto,
          userId,
          GetCompletedKahootsQuery,
        ),
      );
    if (response.isLeft()) this.handleGenericErrors(response.getLeft());
    return response.getRight().toJson();
  }

  private handleGenericErrors(error: Error) {
    throw new InternalServerErrorException(error);
  }

  private handleNotFoundError() {
    throw new HttpException(
      'No se pudo encontrar el kahoot solicitado',
      HttpStatus.NOT_FOUND,
    );
  }

  private handleAddKahootToFavoritesError(error: Error) {
    throw new InternalServerErrorException(error); // TODO: Lanzar errores desde el respositorio
  }

  private handleRemoveKahootFromFavoritesError(error: Error) {
    throw new InternalServerErrorException(error); // TODO: Lanzar errores desde el respositorio
  }
}
