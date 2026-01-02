import { PartialType } from "@nestjs/mapped-types";
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { CreateKahootDTO } from "./kahoot-post.request.dto";

export class UpdateKahootDTO extends CreateKahootDTO {
    //Esta class perdio la razon de ser peor bueno se mantiene por si acaso
    //Eso es debido a que es un put y es esencia un post porque se modifica lo mismo 
}