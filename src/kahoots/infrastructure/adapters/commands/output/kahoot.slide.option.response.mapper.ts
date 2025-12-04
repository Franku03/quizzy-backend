// Application/Kahoot/Mappers/OptionResponseMapper.ts

/*import { OptionResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.slide.option.response.dto";
import { Option } from "src/kahoots/domain/value-objects/kahoot.slide.option";

export class OptionResponseMapper {
    public static toResponseDTO(option: Option, index: number): OptionResponseDTO {

        const optionText = option.text === "" ? null : option.text;

        return {
            id: index.toString(), 
            text: optionText,
            mediaId: option.optionImage.hasValue() 
                ? option.optionImage.getValue().value 
                : null,
            isCorrect: option.isCorrect,
        };
    }
}*/

import { OptionResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.slide.option.response.dto";
import { Option } from "src/kahoots/domain/value-objects/kahoot.slide.option";
import { QueryBus } from '@nestjs/cqrs'; // Nuevo: Necesitas inyectar el QueryBus
import { GetAssetUrlQuery } from "src/media/application/queries/get-asset-url/get-asset-url-by-id.query"; 
import { Injectable } from "@nestjs/common"; // Necesario para inyectar servicios

// Hacemos la clase inyectable para que el SlideResponseMapper pueda inyectarla.
@Injectable() 
export class OptionResponseMapper {
    constructor(private readonly queryBus: QueryBus) {} 

    public async toResponseDTO(option: Option, index: number): Promise<OptionResponseDTO> {
        
        const optionText = option.text === "" ? null : option.text;
        
        const mediaId = option.optionImage.hasValue() 
            ? option.optionImage.getValue().value 
            : null;
        
        let mediaUrl = null;
        if (mediaId) {
            // EJECUTAR EL QUERY: UUID -> URL
            const resultUrl = await this.queryBus.execute(new GetAssetUrlQuery(mediaId));
            mediaUrl = resultUrl;
        }

        return {
            id: index.toString(), 
            text: optionText,
            mediaId: mediaUrl, 
            isCorrect: option.isCorrect,
        };
    }
}