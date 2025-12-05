// explore.mongo.dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Optional } from 'src/core/types/optional';
import { IExploreDao} from 'src/explore/application/queries/ports/explore.dao.port';
import { GetPublicKahootsQueryParams } from 'src/explore/application/queries/ports/explore.dao.port';
import { KahootMongo } from '../../entities/kahoots.schema';
import { CategoryReadModel} from 'src/explore/application/read-models/category.read-model';
import { KahootListReadModel } from 'src/explore/application/read-models/kahoot-list.read-model';
import { PaginatedKahootListReadModel } from 'src/explore/application/read-models/kahoot-list.read-model';

@Injectable()
export class ExploreMongoDao implements IExploreDao {
  constructor(
    @InjectModel(KahootMongo.name) 
    private readonly kahootModel: Model<KahootMongo>,
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
        // Note: Author search will be integrated when user module is ready
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
    let sort: any = { createdAt: -1 };
    if (query.orderBy) {
      // Map the orderBy field to the actual database field
      const sortField = query.orderBy === 'title' ? 'details.title' : query.orderBy;
      const sortDirection = query.order === 'asc' ? 1 : -1;
      sort = { [sortField]: sortDirection };
    }
    
    console.log('MongoDB Filter:', JSON.stringify(filter));
    console.log('MongoDB Sort:', JSON.stringify(sort));
    console.log('Pagination - Skip:', skip, 'Limit:', limit);

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

    console.log(kahoots);

    // Transform MongoDB documents into read models for the application layer
    // This mapping ensures clean separation between persistence and presentation
    const data = kahoots.map(kahoot => {
      return new KahootListReadModel(
        kahoot.id,
        kahoot.details?.title || 'Untitled Kahoot',
        kahoot.details?.description || '',
        kahoot.details?.category || 'Uncategorized',
        {
          id: kahoot.authorId,
          // Temporary placeholder until user module is integrated
          name: this.getAuthor(kahoot.authorId)
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
      playCount: { $gt: 0 }, // Only include kahoots that have been played at least once
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

    // Transform results into the standardized read model format
    return featuredKahoots.map(kahoot => {
      return new KahootListReadModel(
        kahoot.id,
        kahoot.details?.title || 'Untitled Kahoot',
        kahoot.details?.description || '',
        kahoot.details?.category || 'Uncategorized',
        {
          id: kahoot.authorId,
          name: this.getAuthor(kahoot.authorId)
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

  async getAuthorName(authorId: string): Promise<Optional<string>> {
    // This method fetches the author's name based on their ID from the user module
    // When the user module is ready, this should query the user repository
    // For now, return an empty Optional as we're using placeholders in the main methods
    
    console.warn('getAuthorName called but user module not integrated. Returning empty Optional.');
    return new Optional<string>();
  }


  // Generate a simple placeholder author name based on author ID
  // This is temporary until the user module is integrated
  private getAuthor(authorId: string): string {
    // Use a consistent, predictable format for demo purposes
    return `User ${authorId.substring(0, 8)}`;
  }
}