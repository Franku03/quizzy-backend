import { Body, Query, Controller, Post, Param, Req, HttpStatus, HttpCode, Get, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { GetPublicKahootsQuery } from 'src/explore/application/queries/get-public-kahoots/get.public.kahoots.query';
import { GetPublicKahootsQueryParams } from 'src/explore/application/queries/ports/explore.dao.port';
import { EXPLORE_ERROR_CODES } from 'src/explore/application/queries/explore.query.errors';
import { GetFeaturedKahootsQuery } from 'src/explore/application/queries/get-featured-kahoots/get-featured-kahoots.query';
import { GetCategoriesQuery } from 'src/explore/application/queries/get-categories/get-categories.query';
import e from 'express';

@Controller('explore')
export class ExploreController {
    constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

   // This endpoint serves the main explore page, providing paginated access to
  // public kahoots with comprehensive search and filtering capabilities.
  // It implements the GET /explore API specification from the requirements.
  @Get()
  async getPublicKahoots(
    @Query('q') searchTerm?: string,
    @Query('categories') categories?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('orderBy') orderBy?: 'createdAt' | 'title' | 'playCount',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    try {
      // Parse categories from comma-separated string to array
      const categoriesArray = categories ? categories.split(',') : undefined;
      
      // Validate pagination parameters
      if (page && (isNaN(page) || page < 1)) {
        throw new BadRequestException('Page must be a positive integer');
      }
      if (limit && (isNaN(limit) || limit < 1)) {
        throw new BadRequestException('Limit must be a positive integer');
      }
      
      // Validate order parameters if provided
      if (order && !['asc', 'desc'].includes(order)) {
        throw new BadRequestException('Order must be "asc" or "desc"');
      }
      
      return await this.queryBus.execute(
        new GetPublicKahootsQuery(
          searchTerm,
          categoriesArray,
          page ? Number(page) : undefined,
          limit ? Number(limit) : undefined,
          orderBy,
          order,
        ),
      );
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Map domain error codes to appropriate HTTP exceptions
      if (errorMessage.startsWith(EXPLORE_ERROR_CODES.INVALID_PAGINATION_PARAMS)) {
        throw new BadRequestException('Invalid pagination parameters');
      }
      
      if (errorMessage.startsWith(EXPLORE_ERROR_CODES.DATABASE_ERROR)) {
        throw new InternalServerErrorException('Error retrieving kahoots');
      }
      
      // For testing purposes, re-throw the original error instead of a generic
      throw error 
      // For unhandled errors, throw internal server error
      //throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  // This endpoint provides featured kahoots for the platform's discovery section.
  // Featured content is algorithmically selected to highlight engaging, recent kahoots.
  @Get('featured')
  async getFeaturedKahoots(@Query('limit') limit?: number) {
    try {
      if (limit && (isNaN(limit) || limit < 1)) {
        throw new BadRequestException('Limit must be a positive integer');
      }
      
      return await this.queryBus.execute(
        new GetFeaturedKahootsQuery(limit ? Number(limit) : undefined),
      );
    } catch (error) {
      const errorMessage = (error as Error).message;

      if(errorMessage.startsWith(EXPLORE_ERROR_CODES.INVALID_PAGINATION_PARAMS)) {
        throw new BadRequestException('Invalid pagination parameters');
      }
      
      if (errorMessage.startsWith(EXPLORE_ERROR_CODES.DATABASE_ERROR)) {
        throw new InternalServerErrorException('Error retrieving featured kahoots');
      }

      // For testing purposes, re-throw the original error instead of a generic
      throw error 
      //throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  // This endpoint provides the taxonomy of categories available for filtering kahoots.
  // Categories are statically defined and represent the domain's classification system.
  @Get('categories')
  async getCategories() {
    try {
      return await this.queryBus.execute(new GetCategoriesQuery());
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.startsWith(EXPLORE_ERROR_CODES.DATABASE_ERROR)) {
        throw new InternalServerErrorException('Error retrieving categories');
      }
      
      // For testing purposes, re-throw the original error instead of a generic
      throw error 
      //throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

}
