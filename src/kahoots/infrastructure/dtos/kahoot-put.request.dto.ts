import { PartialType } from "@nestjs/mapped-types";
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { CreateKahootDTO } from "./kahoot-post.request.dto";

export class UpdateKahootDTO extends CreateKahootDTO {
    // ⚠️ LEGACY: Mantener por compatibilidad hasta v2.0
    @IsUUID()
    id: string; 

    // ⚠️ LEGACY: Metadata del sistema - no debería ser enviada por el cliente
    @IsOptional()
    @IsDateString()
    createdAt?: string; 
    
    // ⚠️ LEGACY: Contador interno - no debería ser enviado por el cliente
    @IsOptional()
    @IsInt()
    @Min(0)
    playCount?: number; 
}