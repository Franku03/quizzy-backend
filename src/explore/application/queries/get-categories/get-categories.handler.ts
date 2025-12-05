// src/explore/application/queries/get-categories/get-categories.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCategoriesQuery } from './get-categories.query';
import { CategoryReadModel } from '../../read-models/category.read-model';
import type { IExploreDao } from '../ports/explore.dao.port';
import { EXPLORE_ERROR_CODES } from '../explore.query.errors';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

// This handler provides access to the available category list for kahoots.
// Categories are maintained as a static list, regular users cannot modify them.
@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler implements IQueryHandler<GetCategoriesQuery> {
  constructor(
    @Inject(DaoName.Explore)
    private readonly exploreDao: IExploreDao,
  ) {}

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