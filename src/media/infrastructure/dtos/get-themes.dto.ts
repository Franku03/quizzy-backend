import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { GetThemesProps } from 'src/media/application/queries/get-themes/get-themes.query';

export class GetThemesDTO implements GetThemesProps {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number) 
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'uploadedAt' | 'size' | 'originalName';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}