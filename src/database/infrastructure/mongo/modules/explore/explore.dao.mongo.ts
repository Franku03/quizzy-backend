/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\explore\explore.dao.mongo.ts

// explore.mongo.dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IExploreDao} from 'src/explore/application/queries/ports/explore.dao.port';
import { GetPublicKahootsQueryParams } from 'src/explore/application/queries/ports/explore.dao.port';
import { KahootMongo } from '../../entities/kahoots.schema';
import { CategoryReadModel} from 'src/explore/application/read-models/category.read-model';
import { KahootListReadModel } from 'src/explore/application/read-models/kahoot-list.read-model';
import { PaginatedKahootListReadModel } from 'src/explore/application/read-models/kahoot-list.read-model';
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { UserMongo } from '../../entities/users.schema';

@DaoMongo(DaoName.Explore)
@Injectable()
export class ExploreMongoDao implements IExploreDao {
  constructor(
    @InjectModel(KahootMongo.name) 
    private readonly kahootModel: Model<KahootMongo>,
    @InjectModel(UserMongo.name)
    private readonly userModel: Model<UserMongo>,
  ) {}



  async getPublicKahoots(
    query: GetPublicKahootsQueryParams
  ): Promise<PaginatedKahootListReadModel> {
    // Build the base query for published, public kahoots only
    // (only published, public content is visible in explore)
    const filter: any = {
      status: 'PUBLISH',
      visibility: 'PUBLIC',
    };

    // Apply text search across title and description fields
    // Using MongoDB's $regex operator for case-insensitive search
    if (query.searchTerm && query.searchTerm.trim()) {
      const searchTerm = query.searchTerm.trim();
      filter.$or = [
        { 'details.title': { $regex: searchTerm, $options: 'i' } },
        { 'details.description': { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Apply category filtering when categories are specified
    if (query.categories && query.categories.length > 0) {
      filter['details.category'] = { $in: query.categories };
    }

    // Calculate pagination values with sensible defaults
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Determine sort order based on query parameters
    // Defaults to newest first if no specific order is requested
    let sort: any = {};
    
    if (query.orderBy) {
      const sortField = query.orderBy === 'title' ? 'details.title' : query.orderBy;
      const sortDirection = query.order === 'asc' ? 1 : -1;
      
      // PRIMARY SORT: What the user asked for
      sort[sortField] = sortDirection;
    } else {
      // DEFAULT SORT
      sort['createdAt'] = -1;
    }

    // TIE-BREAKER 
    // Always sort by _id as the last criteria to ensure stable pagination
    // matching the direction of the main sort usually helps performance
    sort['_id'] = 1;

    // Execute parallel queries for data and count for optimal performance
    // Using lean() for better performance since we only need plain objects
    const [kahoots, totalCount] = await Promise.all([
      this.kahootModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.kahootModel.countDocuments(filter).exec()
    ]);
  

    // Extract all unique author IDs from the fetched kahoots
    const authorIds = [...new Set(kahoots.map(k => k.authorId).filter(id => id))];

    // Fetch author names in a single batch query for efficiency
    const authorNamesMap = await this.getAuthorNamesMap(authorIds);

    // Transform MongoDB documents into read models
    const data = kahoots.map(kahoot => {
      return new KahootListReadModel(
        kahoot.id,
        kahoot.details?.title || 'Untitled Kahoot',
        kahoot.details?.description || '',
        kahoot.details?.category || 'Uncategorized',
        {
          id: kahoot.authorId,
          // Use author name from the batch fetch, or fallback if not found
          name: authorNamesMap.get(kahoot.authorId) || 'Unknown Author'
        },
        kahoot.playCount || 0,
        new Date(kahoot.createdAt),
        kahoot.styling?.imageId || null,
        kahoot.styling?.themeId || 'default-theme'
      );
    });


    // Calculate pagination metadata to help clients navigate results
    const totalPages = Math.ceil(totalCount / limit);
    
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
    
    // First, get recently created kahoots (last 30 days) with some play activity
    // This ensures fresh content gets visibility while still considering popularity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentFilter = {
      status: 'PUBLISH',
      visibility: 'PUBLIC',
      createdAt: { $gte: thirtyDaysAgo },
    };

    const recentKahoots = await this.kahootModel
      .find(recentFilter)
      .sort({ playCount: -1, createdAt: -1 })
      .limit(featuredLimit)
      .lean()
      .exec();

    // If we don't have enough recent kahoots, supplement with older popular ones
    // This ensures we always return the requested number of featured items
    let featuredKahoots = [...recentKahoots];
    
    if (featuredKahoots.length < featuredLimit) {
      const remaining = featuredLimit - featuredKahoots.length;
      
      const olderFilter = {
        status: 'PUBLISH',
        visibility: 'PUBLIC',
        _id: { $nin: featuredKahoots.map(k => k._id) }, // Avoid duplicates
      };

      const olderKahoots = await this.kahootModel
        .find(olderFilter)
        .sort({ playCount: -1 })
        .limit(remaining)
        .lean()
        .exec();

      featuredKahoots.push(...olderKahoots);
    }

    // Extract all unique author IDs from the featured kahoots
    const featuredAuthorIds = [...new Set(featuredKahoots.map(k => k.authorId).filter(id => id))];

    // Fetch author names in a single batch query for efficiency
    const featuredAuthorNamesMap = await this.getAuthorNamesMap(featuredAuthorIds);

    // Transform results into the standardized read model format with actual author names
    return featuredKahoots.map(kahoot => {
      return new KahootListReadModel(
        kahoot.id,
        kahoot.details?.title || 'Untitled Kahoot',
        kahoot.details?.description || '',
        kahoot.details?.category || 'Uncategorized',
        {
          id: kahoot.authorId,
          // Use author name from the batch fetch, or fallback if not found
          name: featuredAuthorNamesMap.get(kahoot.authorId) || 'Unknown Author'
        },
        kahoot.playCount || 0,
        new Date(kahoot.createdAt),
        kahoot.styling?.imageId || null,
        kahoot.styling?.themeId || 'default-theme'
      );
    });
  }


  async getAvailableCategories(): Promise<CategoryReadModel[]> {
    // Return the static list of categories available in the system
    // These categories represent the domain's taxonomy and are maintained by BackOffice
    // In a future iteration, this could query a dedicated categories collection
    
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
      'General Knowledge'
    ];

    // Sort alphabetically for consistent presentation in dropdowns/filters
    return staticCategories
      .sort((a, b) => a.localeCompare(b))
      .map(category => new CategoryReadModel(category));
  }


  async getAuthorNamesMap(authorIds: string[]): Promise<Map<string, string>> {
    // Fetch multiple author names in a single query to optimize database calls
    // This avoids the N+1 query problem when processing lists of kahoots
    
    if (!authorIds.length) {
      return new Map();
    }

    // Query users collection for the provided author IDs
    const users = await this.userModel.find({
      userId: { $in: authorIds }
    }).select('userId profile.name').lean().exec();

    // Create a map for O(1) lookups when building kahoot read models
    const authorNamesMap = new Map<string, string>();
    
    users.forEach(user => {
      // Use the user's profile name if available, otherwise fall back to a default
      authorNamesMap.set(
        user.userId, 
        user.profile?.name || 'Unknown Author'
      );
    });

    return authorNamesMap;
  }

}