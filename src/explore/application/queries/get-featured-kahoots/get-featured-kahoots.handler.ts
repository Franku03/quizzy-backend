import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { GetFeaturedKahootsQuery } from './get-featured-kahoots.query';
import { KahootListReadModel } from '../../read-models/kahoot-list.read-model';
import type { IExploreDao } from '../ports/explore.dao.port';
import { EXPLORE_ERROR_CODES } from '../explore.query.errors';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { LOGGER_TOKEN } from 'src/core/application/aspects/logging/logger.token';

// This handler processes the query to fetch featured kahoots for the platform.
// Featured kahoots are selected based on a ranking algorithm that balances
// recency (created in last 30 days) and popularity (play count), ensuring users
// see fresh content with proven engagement.
@QueryHandler(GetFeaturedKahootsQuery)
export class GetFeaturedKahootsHandler implements IQueryHandler<GetFeaturedKahootsQuery> {
  private readonly useCase: string = 'User retrieves the list of featured kahoots';

  constructor(
    @Inject(DaoName.Explore)
    private readonly exploreDao: IExploreDao,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) {}

  // The Log decorator automatically logs method execution details. Uses default "logger" property.
  @Log() 
  async execute(query: GetFeaturedKahootsQuery): Promise<KahootListReadModel[]> {
    try {
      // throw error if limit is provided and is not a positive integer
      if (query.limit !== undefined && query.limit <= 0) {
        throw new Error(EXPLORE_ERROR_CODES.INVALID_PAGINATION_PARAMS);
      }

      // Fetch featured kahoots using the DAO method
      // Default to 10 if no limit is provided
      return await this.exploreDao.getFeaturedKahoots(query.limit || 10);
    } catch (error) {
      // Re-throw with domain-specific error code for consistent error handling
      // at the controller level
      throw new Error(EXPLORE_ERROR_CODES.DATABASE_ERROR);
    }
  }
}