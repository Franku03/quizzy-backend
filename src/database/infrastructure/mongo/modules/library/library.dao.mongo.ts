import { Injectable } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import { Optional } from 'src/core/types/optional';
import { GetCompletedKahootsQuery } from 'src/library/application/queries/get-completed-kahoots/get-completed-kahoots.query';
import { GetDraftsAndCreatedKahootsQuery } from 'src/library/application/queries/get-drafts-and-created-kahoots/get-drafts-and-created-kahoots.query';
import { GetFavoritesQuery } from 'src/library/application/queries/get-favorite-kahoots/get-favorites.query';
import { ILibraryDao } from 'src/library/application/queries/ports/library.dao.port';
import { GetInProgressKahootsQuery } from '../../../../../library/application/queries/get-in-progress-kahoots/get-in-progress-kahoots.query';
import {
  KahootReadModel,
  LibraryReadModel,
  PaginationInfo,
} from 'src/library/application/queries/read-model/library.read.model';
import { InjectModel } from '@nestjs/mongoose';
import { KahootMongo } from '../../entities/kahoots.schema';
import { Model } from 'mongoose';
import { UserMongo } from '../../entities/users.schema';
import { AttemptMongo } from '../../entities/attempts.scheme';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';

@Injectable()
export class LibraryDaoMongo implements ILibraryDao {
  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
    @InjectModel(UserMongo.name) private readonly userModel: Model<UserMongo>,
    @InjectModel(AttemptMongo.name)
    private readonly attemptModel: Model<AttemptMongo>,
  ) {}

  private buildQueryStructure(query: GetDraftsAndCreatedKahootsQuery) {
    // filtros base: por autor
    const filters: Record<string, any> = { authorId: query.userId };
    // status
    if (query.status !== 'all') {
      filters.status = query.status;
    }
    // visibility
    if (query.visibility !== 'all') {
      filters.visibility = query.visibility;
    }
    // categories
    if (query.categories && query.categories.length > 0) {
      filters['details.category'] = { $in: query.categories };
    }
    // búsqueda por texto
    if (query.q) {
      filters.$or = [
        { 'details.title': { $regex: query.q, $options: 'i' } },
        { 'details.description': { $regex: query.q, $options: 'i' } },
        { authorId: { $regex: query.q, $options: 'i' } },
      ];
    }
    // ordenamiento
    const sort: Record<string, 1 | -1> = {};
    sort[query.orderBy] = query.order === 'asc' ? 1 : -1;
    // paginación
    const skip = (query.page - 1) * query.limit;
    const limit = query.limit;
    return { filters, sort, skip, limit };
  }

  private mapKahootsToLibraryReadModel(
    kahoots: KahootMongo[],
  ): KahootReadModel[] {
    return kahoots.map(
      (k: KahootMongo) =>
        new KahootReadModel(
          k.id,
          k.details?.title ?? null,
          k.details?.description ?? null,
          k.styling?.imageId ?? null,
          k.visibility as 'public' | 'private',
          k.styling?.themeId,
          { id: k.authorId, name: 'Unknown Author' },
          k.createdAt,
          k.playCount,
          k.details?.category ?? '',
          k.status as 'draft' | 'published',
        ),
    );
  }

  async getDraftsAndCreatedKahootsFrom(
    query: GetDraftsAndCreatedKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    try {
      const { filters, sort, skip, limit } = this.buildQueryStructure(query);
      const [kahoots, totalCount] = await Promise.all([
        this.kahootModel
          .find(filters)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.kahootModel.countDocuments(filters).exec(),
      ]);
      const totalPages = Math.ceil(totalCount / limit);
      const data: KahootReadModel[] =
        this.mapKahootsToLibraryReadModel(kahoots);
      const pagination = new PaginationInfo(
        query.page,
        limit,
        totalCount,
        totalPages,
      );
      const library = new LibraryReadModel(data, pagination);
      return Either.makeRight<Error, LibraryReadModel>(library);
    } catch (err) {
      return Either.makeLeft<Error, LibraryReadModel>(err as Error);
    }
  }
  //TODO USAR MODELO DE USUARIOS Y EL DE KAHOOTS
  async GetFavorites(
    query: GetFavoritesQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    const mockKahoot = new KahootReadModel(
      'mock-id',
      'Mock Kahoot Title',
      'This is a mock description',
      null,
      'public',
      'mock-theme-id',
      { id: 'author-id', name: 'Mock Author' },
      new Date().toISOString(),
      42,
      'Matematica',
      'draft',
    );

    const mockPagination = new PaginationInfo(1, 10, 1, 1);

    const mockLibrary = new LibraryReadModel([mockKahoot], mockPagination);

    return Promise.resolve(
      Either.makeRight<Error, LibraryReadModel>(mockLibrary),
    );
  }

  async checkIfCanBeAddedToFavorites(
    kahootId: string,
  ): Promise<Optional<Error>> {
    try {
      const kahoot = await this.kahootModel.findOne({ id: kahootId }).exec();
      if (!kahoot) {
        // Si no existe, devolvemos un Optional con un Error
        return new Optional(new Error('Kahoot not found'));
      }
      // Si existe, devolvemos un Optional vacío (sin error)
      return new Optional();
    } catch (err) {
      // Si ocurre un error en la consulta, devolvemos el error dentro del Optional
      return new Optional(err as Error);
    }
  }

  async getCompletedKahoots(
    query: GetCompletedKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    try {
      const { userId, limit, page } = query;
      // 1. Filtros para intentos completados
      const filters: {
        playerId: string;
        status: AttemptStatusEnum;
      } = { playerId: userId, status: AttemptStatusEnum.COMPLETED };
      // 2. Paginación
      const skip = (page - 1) * limit;
      // 3. Consultar intentos completados
      const [attempts, totalCount] = await Promise.all([
        this.attemptModel
          .find(filters)
          .sort({ 'timeDetails.completedAt': -1 }) // orden por fecha de completado
          .skip(skip)
          .limit(limit)
          .exec(),
        this.attemptModel.countDocuments(filters).exec(),
      ]);
      const totalPages = Math.ceil(totalCount / limit);
      // 4. Obtener los kahoots asociados a esos intentos
      const kahootIds = attempts.map((a) => a.kahootId);
      const kahoots = await this.kahootModel
        .find({ id: { $in: kahootIds } })
        .exec();
      // 5. Mapear kahoots con función privada
      const data: KahootReadModel[] =
        this.mapKahootsToLibraryReadModel(kahoots);
      // 6. Construir paginación y resultado
      const pagination = new PaginationInfo(
        page,
        limit,
        totalCount,
        totalPages,
      );
      const library = new LibraryReadModel(data, pagination);
      return Either.makeRight<Error, LibraryReadModel>(library);
    } catch (err) {
      return Either.makeLeft<Error, LibraryReadModel>(err as Error);
    }
  }

  async getInProgressKahoots(
    query: GetInProgressKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    try {
      const { userId, limit, page } = query;
      // 1. Filtros para intentos en progreso
      const filters = {
        playerId: userId,
        status: AttemptStatusEnum.IN_PROGRESS,
      };
      // 2. Paginación
      const skip = (page - 1) * limit;
      // 3. Consultar intentos en progreso
      const [attempts, totalCount] = await Promise.all([
        this.attemptModel
          .find(filters)
          .sort({ 'timeDetails.lastPlayedAt': -1 }) // orden por última jugada
          .skip(skip)
          .limit(limit)
          .exec(),
        this.attemptModel.countDocuments(filters).exec(),
      ]);
      const totalPages = Math.ceil(totalCount / limit);
      // 4. Obtener los kahoots asociados a esos intentos
      const kahootIds = attempts.map((a) => a.kahootId);
      const kahoots = await this.kahootModel
        .find({ id: { $in: kahootIds } })
        .exec();
      // 5. Mapear kahoots con función privada
      const data: KahootReadModel[] =
        this.mapKahootsToLibraryReadModel(kahoots);
      // 6. Construir paginación y resultado
      const pagination = new PaginationInfo(
        page,
        limit,
        totalCount,
        totalPages,
      );
      const library = new LibraryReadModel(data, pagination);
      return Either.makeRight<Error, LibraryReadModel>(library);
    } catch (err) {
      return Either.makeLeft<Error, LibraryReadModel>(err as Error);
    }
  }
}
