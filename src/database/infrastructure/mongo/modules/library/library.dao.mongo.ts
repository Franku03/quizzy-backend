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
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

// Manejo de Errores
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';

@DaoMongo(DaoName.Library)
@Injectable()
export class LibraryDaoMongo implements ILibraryDao {
  private readonly adapterContextBase: IDatabaseErrorContext = {
    adapterName: LibraryDaoMongo.name,
    portName: 'ILibraryDao',
    module: 'library',
    databaseType: 'mongodb',
    collectionOrTable: 'users (kahoots and attempts)',
    operation: '',
  } as const;

  private readonly mongoErrorMapper: MongoErrorMapper = new MongoErrorMapper();

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

  private async mapKahootsToLibraryReadModel(
    kahoots: KahootMongo[],
  ): Promise<KahootReadModel[]> {
    // 1. Obtener todos los authorIds únicos
    const authorIds = [...new Set(kahoots.map((k) => k.authorId))];

    // 2. Consultar los usuarios correspondientes
    const authors = await this.userModel
      .find({ userId: { $in: authorIds } })
      .select('userId profile.name')
      .exec();

    // 3. Crear un mapa userId -> nombre
    const authorMap = new Map(authors.map((a) => [a.userId, a.profile.name]));

    // 4. Mapear kahoots con el nombre correcto
    return kahoots.map(
      (k: KahootMongo) =>
        new KahootReadModel(
          k.id,
          k.details?.title ?? null,
          k.details?.description ?? null,
          k.styling?.imageId ?? null,
          k.visibility as 'public' | 'private',
          k.styling?.themeId,
          {
            id: k.authorId,
            name: authorMap.get(k.authorId) ?? 'Unknown Author',
          },
          k.createdAt,
          k.playCount,
          k.details?.category ?? '',
          k.status as 'draft' | 'published',
        ),
    );
  }

  async getDraftsAndCreatedKahootsFrom(
    query: GetDraftsAndCreatedKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'getDraftsAndCreatedKahootsFromUser',
      entityId: query.userId,
    };
    try {
      const userExists = await this.userExists(query.userId);
      if (!userExists)
        return Either.makeLeft<ErrorData, LibraryReadModel>(
          this.handleError(
            ErrorLayer.APPLICATION,
            fullContext,
            '404',
            `User with id ${query.userId} not found`,
          ),
        );
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
        await this.mapKahootsToLibraryReadModel(kahoots);
      const pagination = new PaginationInfo(
        query.page,
        limit,
        totalCount,
        totalPages,
      );
      const library = new LibraryReadModel(data, pagination);
      return Either.makeRight<ErrorData, LibraryReadModel>(library);
    } catch (err) {
      const errorData: ErrorData = this.mongoErrorMapper.toErrorData(
        err,
        fullContext,
      );
      return Either.makeLeft<ErrorData, LibraryReadModel>(errorData);
    }
  }

  async GetFavorites(
    query: GetFavoritesQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'GetFavorites',
      entityId: query.userId,
    };
    try {
      const userExists = await this.userExists(query.userId);
      if (!userExists)
        return Either.makeLeft<ErrorData, LibraryReadModel>(
          this.handleError(
            ErrorLayer.APPLICATION,
            fullContext,
            '404',
            `User with id ${query.userId} not found`,
          ),
        );
      const { userId, limit, page } = query;
      // 1. Buscar usuario
      const user = await this.userModel.findOne({ userId }).exec();
      if (!user) {
        return Either.makeLeft<ErrorData, LibraryReadModel>(
          this.handleError(
            ErrorLayer.APPLICATION,
            fullContext,
            '404',
            `User with id ${query.userId} not found`,
          ),
        );
      }
      // 2. Obtener IDs de kahoots favoritos
      const favoriteIds = user.favoriteKahoots ?? [];
      if (favoriteIds.length === 0) {
        const emptyPagination = new PaginationInfo(page, limit, 0, 0);
        const emptyLibrary = new LibraryReadModel([], emptyPagination);
        return Either.makeRight<ErrorData, LibraryReadModel>(emptyLibrary);
      }
      // 3. Paginación
      const skip = (page - 1) * limit;
      // 4. Consultar kahoots favoritos
      const [kahoots, totalCount] = await Promise.all([
        this.kahootModel
          .find({ id: { $in: favoriteIds } })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.kahootModel.countDocuments({ id: { $in: favoriteIds } }).exec(),
      ]);
      const totalPages = Math.ceil(totalCount / limit);
      // 5. Mapear kahoots con función privada
      const data: KahootReadModel[] =
        await this.mapKahootsToLibraryReadModel(kahoots);
      // 6. Construir paginación y resultado
      const pagination = new PaginationInfo(
        page,
        limit,
        totalCount,
        totalPages,
      );
      const library = new LibraryReadModel(data, pagination);
      return Either.makeRight<ErrorData, LibraryReadModel>(library);
    } catch (err) {
      const errorData: ErrorData = this.mongoErrorMapper.toErrorData(
        err,
        fullContext,
      );
      return Either.makeLeft<ErrorData, LibraryReadModel>(errorData);
    }
  }

  async checkIfCanBeAddedToFavorites(
    kahootId: string,
  ): Promise<Optional<ErrorData>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'CheckIfKahootCanBeAddedToFavorites',
      entityId: kahootId,
    };
    try {
      const kahoot = await this.kahootModel.findOne({ id: kahootId }).exec();
      if (!kahoot) {
        // Si no existe, devolvemos un Optional con un Error
        return new Optional(
          this.handleError(
            ErrorLayer.APPLICATION,
            fullContext,
            '404',
            `Kahoot with id ${kahootId} not Found`,
          ),
        );
      }
      // Si existe, devolvemos un Optional vacío (sin error)
      return new Optional();
    } catch (err) {
      // Si ocurre un error en la consulta, devolvemos el error dentro del Optional
      const errorData: ErrorData = this.mongoErrorMapper.toErrorData(
        err,
        fullContext,
      );
      return new Optional(errorData);
    }
  }

  async getCompletedKahoots(
    query: GetCompletedKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'getCompletedKahoots',
      entityId: query.userId,
    };
    try {
      const userExists = await this.userExists(query.userId);
      if (!userExists)
        return Either.makeLeft<ErrorData, LibraryReadModel>(
          this.handleError(
            ErrorLayer.APPLICATION,
            fullContext,
            '404',
            `User with id ${query.userId} not found`,
          ),
        );
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
        await this.mapKahootsToLibraryReadModel(kahoots);
      // 6. Construir paginación y resultado
      const pagination = new PaginationInfo(
        page,
        limit,
        totalCount,
        totalPages,
      );
      const library = new LibraryReadModel(data, pagination);
      return Either.makeRight<ErrorData, LibraryReadModel>(library);
    } catch (err) {
      const errorData: ErrorData = this.mongoErrorMapper.toErrorData(
        err,
        fullContext,
      );
      return Either.makeLeft<ErrorData, LibraryReadModel>(errorData);
    }
  }

  async getInProgressKahoots(
    query: GetInProgressKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'getCompletedKahoots',
      entityId: query.userId,
    };
    try {
      const userExists = await this.userExists(query.userId);
      if (!userExists)
        return Either.makeLeft<ErrorData, LibraryReadModel>(
          this.handleError(
            ErrorLayer.APPLICATION,
            fullContext,
            '404',
            `User with id ${query.userId} not found`,
          ),
        );
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
        await this.mapKahootsToLibraryReadModel(kahoots);
      // 6. Construir paginación y resultado
      const pagination = new PaginationInfo(
        page,
        limit,
        totalCount,
        totalPages,
      );
      const library = new LibraryReadModel(data, pagination);
      return Either.makeRight<ErrorData, LibraryReadModel>(library);
    } catch (err) {
      const errorData: ErrorData = this.mongoErrorMapper.toErrorData(
        err,
        fullContext,
      );
      return Either.makeLeft<ErrorData, LibraryReadModel>(errorData);
    }
  }

  private handleError(
    layer: ErrorLayer,
    context: IDatabaseErrorContext,
    code: string,
    errorMessage: string,
  ): ErrorData {
    return new ErrorData(code, errorMessage, layer, {
      ...context,
    });
  }

  async userExists(userId: string): Promise<boolean> {
    // Si tu esquema tiene la propiedad "userId"
    const exists = await this.userModel.exists({ userId });
    return !!exists;
  }
}
