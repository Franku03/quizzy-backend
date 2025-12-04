// Application/Kahoot/Mappers/SlideResponseMapper.ts

/*import { Slide } from "src/kahoots/domain/entities/kahoot.slide";
import { SlideResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.slide.response.dto";
import { OptionResponseMapper } from "./kahoot.slide.option.response.mapper";

export class SlideResponseMapper {
   
    public static toResponseDTO(slide: Slide): SlideResponseDTO {
        
        const options = slide.options.hasValue() 
            ? slide.options.getValue() 
            : null;
            
        const answersDTO = options 
            ? options.map((option, index) => 
                OptionResponseMapper.toResponseDTO(option, index)
              )
            : null;
            
        return {
            id: slide.id.value, 
            text: slide.question.hasValue() 
                ? slide.question.getValue().value 
                : null,
            mediaId: slide.slideImage.hasValue() 
                ? slide.slideImage.getValue().value 
                : null,
                
            type: slide.slideType.type.toLowerCase(), 
            timeLimit: slide.timeLimit.value, 
            points: slide.points.hasValue() 
                ? slide.points.getValue().value 
                : null,
            position: slide.position,
            answers: answersDTO, 
        };
    }
}*/

// Application/Kahoot/Mappers/SlideResponseMapper.ts (MODIFICADO)

import { Slide } from "src/kahoots/domain/entities/kahoot.slide";
import { SlideResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.slide.response.dto";
import { OptionResponseMapper } from "./kahoot.slide.option.response.mapper";
import { QueryBus } from '@nestjs/cqrs'; 
import { GetAssetUrlQuery } from "src/media/application/queries/get-asset-url/get-asset-url-by-id.query";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SlideResponseMapper {
    constructor(
        private readonly queryBus: QueryBus, // Inyectamos QueryBus
        private readonly optionResponseMapper: OptionResponseMapper, // Inyectamos el mapper de opciones
    ) {}

    // El método ahora es ASÍNCRONO
    public async toResponseDTO(slide: Slide): Promise<SlideResponseDTO> {
        
        const options = slide.options.hasValue() 
            ? slide.options.getValue() 
            : null;
        
        // --- 1. Mapear Opciones (Answers) de forma asíncrona ---
        const answersDTO = options 
            ? await Promise.all(
                options.map((option, index) => 
                    this.optionResponseMapper.toResponseDTO(option, index)
                )
            )
            : null;

        // --- 2. Mapear Imagen del Slide (mediaId) ---
        const slideMediaId = slide.slideImage.hasValue() 
            ? slide.slideImage.getValue().value 
            : null;

        let slideMediaUrl = null;
        if (slideMediaId) {
            // EJECUTAR EL QUERY: UUID -> URL
            slideMediaUrl = await this.queryBus.execute(new GetAssetUrlQuery(slideMediaId));
        }

        return {
            id: slide.id.value, 
            text: slide.question.hasValue() 
                ? slide.question.getValue().value 
                : null,
            mediaId: slideMediaUrl, // Ahora es la URL
            
            type: slide.slideType.type.toLowerCase(), 
            timeLimit: slide.timeLimit.value, 
            points: slide.points.hasValue() 
                ? slide.points.getValue().value 
                : null,
            position: slide.position,
            answers: answersDTO, 
        };
    }
}