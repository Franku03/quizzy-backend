import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { cleanNullToUndefined } from "./helper.request.dto.";
import { OptionInputDTO } from "./kahoot.slide.option.request.dto";

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
    @Min(1)
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