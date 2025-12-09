import { IsBoolean, IsOptional, IsString } from "class-validator";
import { cleanNullToUndefined } from "./helper.request.dto.";
import { Transform } from "class-transformer";

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