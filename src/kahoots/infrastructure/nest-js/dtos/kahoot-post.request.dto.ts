import { Transform, Type } from "class-transformer";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { cleanNullToUndefined, toUpperCase } from "./helper.request.dto.";
import { SlideInputDTO } from "./kahoot.slide.request.dto";

export class CreateKahootDTO {
    // Campos opcionales
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    title?: string;

    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    description?: string;
    
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    coverImageId?: string;
    
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    category?: string;

    // Campos requeridos
    @IsString()
    @Transform(toUpperCase)
    status: string; // "DRAFT" o "PUBLISHED"
    
    @IsString()
    @Transform(toUpperCase)
    visibility: string; // "PRIVATE" o "PUBLIC"
    
    @IsUUID()
    themeId: string;
    
    // Array opcional - la validación de "published requiere questions" va en dominio
    @Type(() => SlideInputDTO)
    @IsOptional()
    questions?: SlideInputDTO[];
    
    // ❌ authorId REMOVIDO del DTO (viene del token)
}