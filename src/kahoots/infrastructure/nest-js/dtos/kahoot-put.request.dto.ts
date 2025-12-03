import { PartialType } from "@nestjs/mapped-types";
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { CreateKahootDTO } from "./kahoot-post.request.dto"; 

export class UpdateKahootDTO extends PartialType(CreateKahootDTO) {
    @IsUUID()
    id: string; 

    @IsOptional()
    @IsDateString()
    createdAt?: string; 
    
    @IsOptional()
    @IsInt()
    @Min(0)
    playCount?: number; 
}