// src/explore/application/queries/get-categories/get-categories.handler.ts
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { GetCategoriesQuery } from './get-categories.query';
import { CategoryReadModel } from '../../read-models/category.read-model';
import type { IExploreDao } from '../ports/explore.dao.port';
import { EXPLORE_ERROR_CODES } from '../explore.query.errors';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { LOGGER_TOKEN } from 'src/core/application/aspects/logging/logger.token';

// This handler provides access to the available category list for kahoots.
// Categories are maintained as a static list, regular users cannot modify them.
@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler implements IQueryHandler<GetCategoriesQuery> {
  private readonly useCase: string = 'User retrieves the list of available kahoot categories';

  constructor(
    @Inject(DaoName.Explore)
    private readonly exploreDao: IExploreDao,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) {}

  // The Log decorator automatically logs method execution details. Uses default "logger" property.
  @Log() 
  // query object is empty, no parameters needed.
  // however, it is necessary to conform to the IQueryHandler interface.
  // and for the bus to route the query correctly.
  async execute(query: GetCategoriesQuery): Promise<CategoryReadModel[]> {
    try {
      return await this.exploreDao.getAvailableCategories();
    } catch (error) {
      throw new Error(EXPLORE_ERROR_CODES.DATABASE_ERROR);
    }
  }
}