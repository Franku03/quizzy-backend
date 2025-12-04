import { Transform, Type } from "class-transformer";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { cleanNullToUndefined, toUpperCase } from "./helper.request.dto.";
import { SlideInputDTO } from "./kahoot.slide.request.dto";

export class CreateKahootDTO {
    // title: String (Opcional). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    title?: string;

    // description: String (Opcional). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    description?: string;
    
    // coverImageId: URL (Opcional). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    coverImageId?: string;
    @IsUUID()
    authorId: string; 
    @IsString()
    @Transform(toUpperCase)
    status: string; 

    @IsString()
    @Transform(toUpperCase)
    visibility: string; 

    @IsUUID()
    themeId: string;
    
    // category: String (Opcional). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    category?: string;

    // questions: Array anidado (Opcional).
    @Type(() => SlideInputDTO)
    @IsOptional()
    questions?: SlideInputDTO[]; 
}