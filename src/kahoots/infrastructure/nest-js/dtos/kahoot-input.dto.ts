// Archivo: src/kahoot/dto/kahoot-input.dto.ts

import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsInt, IsBoolean, IsUUID, IsDateString, Min } from 'class-validator';

// Función genérica de purga: Convierte explícitamente null a undefined
const cleanNullToUndefined = ({ value }: { value: any }) => value === null ? undefined : value;


// ----------------------------------------------------
// 1. OptionInputDTO (Anidado, Reutilizable)
// ----------------------------------------------------
export class OptionInputDTO {
    // text: String (Opcional, puede estar vacío). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    text?: string; 

    // mediaId: URL (String) (Opcional). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    mediaId?: string;
    
    // isCorrect: Boolean (Obligatorio en el input)
    @IsBoolean()
    isCorrect: boolean; 
}

// ----------------------------------------------------
// 2. SlideInputDTO (Anidado, Reutilizable)
// ----------------------------------------------------
export class SlideInputDTO {
    // id: UUID (Question ID). Opcional si es un slide nuevo, Requerido si es update.
    @IsOptional()
    @IsUUID()
    id?: string; 

    // type: String (Obligatorio)
    @IsString()
    type: string; 
    
    // timeLimit: Integer (Obligatorio)
    @IsInt()
    @Min(1) // Asumimos un mínimo lógico
    timeLimit: number;

    // points: Integer (Opcional, puede ser null). Purgamos null a undefined.
    @IsOptional()
    @IsInt()
    @Transform(cleanNullToUndefined) 
    points?: number;
    
    // text: String (Opcional). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    text?: string;

    // mediaId: URL (Opcional). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    mediaId?: string;

    // answers: Array anidado (Opcional). Aseguramos la transformación recursiva.
    @Type(() => OptionInputDTO) 
    @IsOptional()
    answers?: OptionInputDTO[]; 
}

// ----------------------------------------------------
// 3. KahootBaseFieldsDTO (Campos Comunes y Opcionales)
// ----------------------------------------------------
// Contiene todos los campos opcionales que se repiten en CREATE y UPDATE
export class KahootBaseFieldsDTO {
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

// ----------------------------------------------------
// 4. CreateKahootDTO (Para POST: Creación)
// ----------------------------------------------------
export class CreateKahootDTO extends KahootBaseFieldsDTO {
    // id: UUID (No se envía, se genera. Opcional/Excluido)

    // authorId: UUID (Obligatorio)
    @IsUUID()
    authorId: string; 

    // themeId: UUID (Obligatorio)
    @IsUUID()
    themeId: string;

    // visibility: String (Obligatorio)
    @IsString()
    visibility: string; 

    // status: String (Obligatorio)
    @IsString()
    status: string;   

    // createdAt: ISO 8601 Date String (Obligatorio)
    @IsDateString()
    createdAt: string;

    // playCount: Integer (Obligatorio)
    @IsOptional()
    @IsInt()
    @Min(0)
    playCount: number;
}

// ----------------------------------------------------
// 5. UpdateKahootDTO (Para PUT/PATCH: Actualización)
// ----------------------------------------------------
export class UpdateKahootDTO extends KahootBaseFieldsDTO {
    // id: UUID (Kahoot ID) - Obligatorio para saber qué actualizar
    @IsUUID()
    id: string;

    // Los siguientes campos son opcionales en el PUT/PATCH

    @IsOptional()
    @IsUUID()
    authorId?: string; 
    
    @IsOptional()
    @IsUUID()
    themeId?: string;

    @IsOptional()
    @IsString()
    visibility?: string; 

    @IsOptional()
    @IsString()
    status?: string;   

    @IsOptional()
    @IsDateString()
    createdAt?: string;

    @IsInt()
    @Min(0)
    playCount?: number;
}