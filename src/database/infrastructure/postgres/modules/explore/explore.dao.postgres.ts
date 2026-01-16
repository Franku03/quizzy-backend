/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\explore\explore.dao.postgres.ts

// explore.postgres.dao.ts

import { Injectable } from '@nestjs/common';
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';
import { KahootEntity } from '../../entities/kahoot/kahoot.entity.pg';
import { OptionEntity } from '../../entities/kahoot/option.entity.pg';
import { SlideEntity } from '../../entities/kahoot/slide.entitity.pg';
import { IExploreDao } from 'src/explore/application/queries/ports/explore.dao.port';
import { UserEntity } from '../../entities/users.entity';
import { GetPublicKahootsQueryParams } from 'src/explore/application/queries/ports/explore.dao.port';
import { CategoryReadModel} from 'src/explore/application/read-models/category.read-model';
import { KahootListReadModel } from 'src/explore/application/read-models/kahoot-list.read-model';
import { PaginatedKahootListReadModel } from 'src/explore/application/read-models/kahoot-list.read-model';

@DaoPostgres(DaoName.Explore)
@Injectable()
export class ExplorePostgresDao implements IExploreDao {
  // We inject the postgres entities needed.
  // These provide access to the 'attempts' and 'kahoots' collections.
  constructor(
    @InjectRepository(KahootEntity)
    private readonly kahootRepo: Repository<KahootEntity>,
    @InjectRepository(OptionEntity)
    private readonly optionRepo: Repository<OptionEntity>,
    @InjectRepository(SlideEntity)
    private readonly slideRepo: Repository<SlideEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}
  

  async getPublicKahoots(
    query: GetPublicKahootsQueryParams,
  ): Promise<PaginatedKahootListReadModel> {
    // We create a TypeORM QueryBuilder to construct our SQL query piece by piece
    // QueryBuilder is TypeORM's way of building complex SQL queries programmatically
    // 'kahoot' is the alias we give to the KahootEntity table for this query
    const queryBuilder: SelectQueryBuilder<KahootEntity> = this.kahootRepo
      .createQueryBuilder('kahoot')
      .where('kahoot.status = :status', { status: 'PUBLISH' })
      .andWhere('kahoot.visibility = :visibility', { visibility: 'PUBLIC' });

    // Apply text search if a search term is provided
    // In PostgreSQL, ILIKE is a case-insensitive pattern matching operator
    // The % symbols are wildcards: %term% matches any text containing 'term'
    // This is PostgreSQL's equivalent to MongoDB's $regex with 'i' option
    if (query.searchTerm && query.searchTerm.trim()) {
      const searchTerm = `%${query.searchTerm.trim()}%`;
      // We use parentheses to group the OR conditions properly in SQL
      queryBuilder.andWhere(
        '(kahoot.title ILIKE :searchTerm OR kahoot.description ILIKE :searchTerm)',
        { searchTerm },
      );
    }

    // Apply category filtering when categories are specified
    // TypeORM's :...categories syntax expands the array into SQL IN clause values
    // Example: ['Math', 'Science'] becomes IN ('Math', 'Science')
    if (query.categories && query.categories.length > 0) {
      queryBuilder.andWhere('kahoot.category IN (:...categories)', {
        categories: query.categories,
      });
    }

    // Calculate pagination values
    // Skip/Take in TypeORM = LIMIT/OFFSET in SQL
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Determine sorting logic
    // TypeORM's orderBy method generates SQL ORDER BY clauses
    let orderByField = 'kahoot.createdAt';
    let orderDirection: 'ASC' | 'DESC' = 'DESC';

    if (query.orderBy) {
      // Map the business logic field names to actual database column names
      // PostgreSQL column names are case-sensitive when quoted, but TypeORM handles this
      if (query.orderBy === 'title') {
        orderByField = 'kahoot.title';
      } else if (query.orderBy === 'playCount') {
        orderByField = 'kahoot.playCount';
      } else {
        orderByField = `kahoot.${query.orderBy}`;
      }

      // Convert 'asc'/'desc' strings to SQL keywords ASC/DESC
      orderDirection = query.order === 'asc' ? 'ASC' : 'DESC';
    }

    // Apply the primary sort to the query
    // This will generate SQL like: ORDER BY kahoot.createdAt DESC
    queryBuilder.orderBy(orderByField, orderDirection);

    // Add a secondary sort by ID for stable pagination
    // When multiple items have the same value in the primary sort field (same date, same play count),
    // sorting by ID ensures they always appear in the same order across pagination requests
    // This prevents items from jumping between pages when data changes
    queryBuilder.addOrderBy('kahoot.id', 'ASC');

    // Apply pagination limits
    // skip() = OFFSET in SQL (how many rows to skip from the beginning)
    // take() = LIMIT in SQL (how many rows to return)
    queryBuilder.skip(skip).take(limit);

    // Execute parallel queries for better performance
    // getMany() returns the actual data rows as entity objects
    // getCount() returns the total number of rows matching the filters (without pagination)
    // Promise.all() runs both queries concurrently, not sequentially
    const [kahoots, totalCount] = await Promise.all([
      queryBuilder.getMany(),
      queryBuilder.getCount(),
    ]);

    // Extract unique author IDs from the fetched kahoots
    // We use a Set to automatically deduplicate IDs
    // Filter removes any undefined or null author IDs
    const authorIds = [...new Set(kahoots.map((k) => k.authorId).filter((id) => id))];

    // Batch fetch author names to avoid N+1 query problem
    // Without batching, we'd make one query per author (very inefficient)
    const authorNamesMap = await this.getAuthorNamesMap(authorIds);

    // Transform database entities into read models
    // This is where we adapt the database representation to our application's domain model
    const data = kahoots.map((kahoot) => {
      return new KahootListReadModel(
        kahoot.id,
        kahoot.title || 'Untitled Kahoot',
        kahoot.description || '',
        kahoot.category || 'Uncategorized',
        {
          id: kahoot.authorId,
          // Look up author name in our pre-fetched map
          // The Map.get() is O(1) constant time lookup
          name: authorNamesMap.get(kahoot.authorId) || 'Unknown Author',
        },
        kahoot.playCount || 0,
        // Ensure createdAt is a proper Date object (TypeORM returns Date already, but being safe)
        new Date(kahoot.createdAt),
        kahoot.coverImageId || null,
        kahoot.themeId || 'default-theme',
      );
    });

    // Just in case limit is zero (to avoid division by zero)
    const safeLimit = limit > 0 ? limit : 1;

    // Calculate pagination metadata
    // Math.ceil ensures we round up for partial pages
    const totalPages = Math.ceil(totalCount / safeLimit);
    return new PaginatedKahootListReadModel(data, {
      page,
      limit,
      totalCount,
      totalPages,
    });
  }



  async getFeaturedKahoots(limit: number): Promise<KahootListReadModel[]> {
    // Featured kahoots use a scoring algorithm that balances recency and popularity
    // We prioritize recent kahoots with engagement, then supplement with older popular ones
    const featuredLimit = limit || 10;

    // Calculate the date for 30 days ago to filter recent kahoots
    // This ensures fresh content gets visibility while considering popularity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First query: fetch recent kahoots (last 30 days) ordered by popularity
    // TypeORM's createQueryBuilder allows us to build complex SQL queries programmatically
    const recentQueryBuilder = this.kahootRepo
      .createQueryBuilder('kahoot')
      .where('kahoot.status = :status', { status: 'PUBLISH' })
      .andWhere('kahoot.visibility = :visibility', { visibility: 'PUBLIC' })
      .andWhere('kahoot.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      // Order by playCount descending (most popular first), then by createdAt descending
      // This prioritizes both engagement and freshness within the recent period
      .orderBy('kahoot.playCount', 'DESC')
      .addOrderBy('kahoot.createdAt', 'DESC')
      .take(featuredLimit);

    const recentKahoots = await recentQueryBuilder.getMany();

    // If we don't have enough recent kahoots, supplement with older popular ones
    // This ensures we always return the requested number of featured items
    let featuredKahoots = [...recentKahoots];

    if (featuredKahoots.length < featuredLimit) {
      const remaining = featuredLimit - featuredKahoots.length;

      // Create a list of IDs we've already fetched to avoid duplicates
      // TypeORM's .where() with NOT IN clause excludes already fetched kahoots
      const existingIds = featuredKahoots.map((k) => k.id);

      const olderQueryBuilder = this.kahootRepo
        .createQueryBuilder('kahoot')
        .where('kahoot.status = :status', { status: 'PUBLISH' })
        .andWhere('kahoot.visibility = :visibility', { visibility: 'PUBLIC' })
        .andWhere('kahoot.createdAt < :thirtyDaysAgo', { thirtyDaysAgo });

      // Only add NOT IN clause if we have existing IDs to exclude
      if (existingIds.length > 0) {
        olderQueryBuilder.andWhere('kahoot.id NOT IN (:...existingIds)', {
          existingIds,
        });
      }

      // For older kahoots, sort primarily by playCount (popularity)
      const olderKahoots = await olderQueryBuilder
        .orderBy('kahoot.playCount', 'DESC')
        .take(remaining)
        .getMany();

      featuredKahoots.push(...olderKahoots);
    }

    // Extract unique author IDs from the featured kahoots
    // We use a Set to automatically remove duplicates and filter out null/undefined IDs
    const featuredAuthorIds = [
      ...new Set(featuredKahoots.map((k) => k.authorId).filter((id) => id)),
    ];

    // Batch fetch author names to avoid N+1 query problem
    // This single query replaces what would be many individual user lookups
    const featuredAuthorNamesMap = await this.getAuthorNamesMap(
      featuredAuthorIds,
    );

    // Transform database entities into read models for the application layer
    // This adapts the database representation to our domain's read model structure
    return featuredKahoots.map((kahoot) => {
      return new KahootListReadModel(
        kahoot.id,
        kahoot.title || 'Untitled Kahoot',
        kahoot.description || '',
        kahoot.category || 'Uncategorized',
        {
          id: kahoot.authorId,
          // Look up author name in our pre-fetched map
          // Map.get() provides O(1) constant time lookup efficiency
          name: featuredAuthorNamesMap.get(kahoot.authorId) || 'Unknown Author',
        },
        kahoot.playCount || 0,
        // Ensure createdAt is a proper Date object
        // TypeORM returns Date objects, but we're being explicit for clarity
        new Date(kahoot.createdAt),
        kahoot.coverImageId || null,
        kahoot.themeId || 'default-theme',
      );
    });
  }

  async getAvailableCategories(): Promise<CategoryReadModel[]> {
    // Return the static list of categories available in the system
    // These categories represent the domain's taxonomy and are maintained by BackOffice
    // In a future iteration, this could query a dedicated categories table
    const staticCategories = [
      'Mathematics',
      'Science',
      'Biology',
      'Chemistry',
      'Physics',
      'Literature',
      'History',
      'Geography',
      'Art',
      'Music',
      'Technology',
      'Sports',
      'Languages',
      'Computer Science',
      'Social Studies',
      'Philosophy',
      'Economics',
      'Psychology',
      'Trivia',
      'General Knowledge',
    ];

    // Sort alphabetically for consistent presentation in UI dropdowns and filters
    // This ensures users always see categories in the same predictable order
    return staticCategories
      .sort((a, b) => a.localeCompare(b))
      .map((category) => new CategoryReadModel(category));
  }



  async getAuthorNamesMap(authorIds: string[]): Promise<Map<string, string>> {
    // This method solves the N+1 query problem by fetching all author names in one query
    // Instead of querying for each author individually, we query once with an IN clause
    if (!authorIds.length) {
      return new Map();
    }

    // Create a query to fetch users by their IDs
    // TypeORM's createQueryBuilder gives us fine-grained control over the SQL
    const users = await this.userRepo
      .createQueryBuilder('user')
      // Select only the fields we need (optimization: don't fetch entire user objects)
      .select(['user.id', 'user.profileName'])
      // WHERE id IN (id1, id2, id3) - single query for multiple IDs
      .where('user.id IN (:...authorIds)', { authorIds })
      // Exclude deleted users from the results
      .andWhere('user.isDeleted = false')
      // Execute the query and get plain JavaScript objects (not full entities)
      .getMany();

    // Create a Map for O(1) lookup time
    // Maps in JavaScript maintain insertion order and have constant-time get/set operations
    const authorNamesMap = new Map<string, string>();

    // Populate the map with user ID -> name mappings
    users.forEach((user) => {
      // Use profileName if available, otherwise provide a default
      authorNamesMap.set(user.id, user.profileName || 'Unknown Author');
    });

    return authorNamesMap;
  }
}