// src/kahoots/infrastructure/adapters/mappers/create-kahoot.request.mapper.ts
import { Injectable } from "@nestjs/common";
import { CreateKahootCommand } from "src/kahoots/application/commands";
import { CreateKahootDTO } from "src/kahoots/infrastructure/dtos";
import { BaseKahootRequestMapper } from "./base-kahoot.request.mapper";

export type CreateKahootInput = { dto: CreateKahootDTO; userId: string };

@Injectable()
export class CreateKahootRequestMapper extends BaseKahootRequestMapper<CreateKahootInput, CreateKahootCommand> {
    
    public map(input: CreateKahootInput): CreateKahootCommand {
        const { dto, userId } = input;

        return new CreateKahootCommand({
            ...dto,
            slides: this.mapSlides(dto.questions),
            imageId: dto.coverImageId,
            userId,
        });
    }
}