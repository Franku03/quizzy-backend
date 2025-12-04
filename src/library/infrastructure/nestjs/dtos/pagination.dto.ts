// infrastructure/dto/pagination.dto.ts
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
  IsArray,
} from 'class-validator';

export enum StatusEnum {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ALL = 'all',
}

export enum VisibilityEnum {
  PUBLIC = 'public',
  PRIVATE = 'private',
  ALL = 'all',
}

export enum OrderByEnum {
  CREATED_AT = 'createdAt',
  TITLE = 'title',
  LIKES_COUNT = 'likesCount',
}

export enum OrderEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsEnum(StatusEnum)
  status: StatusEnum = StatusEnum.ALL;

  @IsOptional()
  @IsEnum(VisibilityEnum)
  visibility: VisibilityEnum = VisibilityEnum.ALL;

  @IsOptional()
  @IsEnum(OrderByEnum)
  orderBy: OrderByEnum = OrderByEnum.CREATED_AT;

  @IsOptional()
  @IsEnum(OrderEnum)
  order: OrderEnum = OrderEnum.ASC;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories: string[] = [];

  @IsOptional()
  @IsString()
  q?: string;
}
