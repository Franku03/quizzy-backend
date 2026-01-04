// src/kahoots/infrastructure/adapters/mappers/update-kahoot.request.mapper.ts
import { Injectable } from "@nestjs/common";
import { UpdateKahootCommand } from "src/kahoots/application/commands";
import { UpdateKahootDTO } from "src/kahoots/infrastructure/dtos";
import { BaseKahootRequestMapper } from "./base-kahoot.request.mapper";

export type ReplaceKahootInput = { dto: UpdateKahootDTO; id: string; userId: string };

@Injectable()
export class UpdateKahootRequestMapper extends BaseKahootRequestMapper<ReplaceKahootInput, UpdateKahootCommand> {
    
    public map(input: ReplaceKahootInput): UpdateKahootCommand {
        const { dto, id, userId } = input;

        return new UpdateKahootCommand({
            ...dto,
            slides: this.mapSlides(dto.questions),
            imageId: dto.coverImageId,
            id,
            userId
        });
    }
}