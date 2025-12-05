// src/explore/application/queries/get-public-kahoots/get-public-kahoots.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPublicKahootsQuery } from './get.public.kahoots.query';
import { PaginatedKahootListReadModel } from '../../read-models/kahoot-list.read-model';
import type { IExploreDao } from '../ports/explore.dao.port';
import { EXPLORE_ERROR_CODES } from '../explore.query.errors';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

// This handler processes the query to fetch public kahoots with pagination and filtering.
// It serves the GET /explore endpoint by retrieving published, public kahoots based on
// various search and filter criteria provided by the user.
@QueryHandler(GetPublicKahootsQuery)
export class GetPublicKahootsHandler implements IQueryHandler<GetPublicKahootsQuery> {
  constructor(
    @Inject(DaoName.Explore)
    private readonly exploreDao: IExploreDao,
  ) {}

  async execute(query: GetPublicKahootsQuery): Promise<PaginatedKahootListReadModel> {
    // Throw error if pagination parameters are invalid
    if (query.page !== undefined && query.page <= 0) {
      throw new Error(EXPLORE_ERROR_CODES.INVALID_PAGINATION_PARAMS);
    }
    if (query.limit !== undefined && query.limit <= 0) {
      throw new Error(EXPLORE_ERROR_CODES.INVALID_PAGINATION_PARAMS);
    }

    // default limit to 20 if not provided
    const limit = query.limit? query.limit : 20;
    // default page to 1 if not provided
    const page = query.page? query.page : 1;
    
    // Only published, public kahoots are visible in explore
    // The DAO implementation enforces this by filtering on status and visibility
    // when querying the database.
    try {
      // Delegate to the DAO to fetch public kahoots with the specified parameters
      return await this.exploreDao.getPublicKahoots({
        searchTerm: query.searchTerm,
        categories: query.categories,
        page: page, 
        limit: limit,
        orderBy: query.orderBy,
        order: query.order,
      });
    } catch (error) {
      // If the DAO throws an error related to invalid parameters, we re-throw it
      // with a specific error code for proper handling at the controller level
      throw new Error(EXPLORE_ERROR_CODES.DATABASE_ERROR);
    }
  }
}