import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";

export class PaginationDto {

    @IsPositive()
    @Type( () => Number ) //enableImplicitConversions: true
    limit?: number;

    @IsOptional()
    @Min(1)
    @Type( () => Number ) 
    page?: number;

}