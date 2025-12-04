// Application/Kahoot/Mappers/SlideResponseMapper.ts

import { Slide } from "src/kahoots/domain/entities/kahoot.slide";
import { SlideResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.slide.response.dto";
import { OptionResponseMapper } from "./kahoot.slide.option.response.mapper";

export class SlideResponseMapper {
    /**
     * Mapea la Entidad Slide del Dominio al DTO de Respuesta.
     * @param slide La entidad de Dominio Slide.
     */
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
}