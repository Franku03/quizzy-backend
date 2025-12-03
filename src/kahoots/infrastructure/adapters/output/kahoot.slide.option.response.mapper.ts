// Application/Kahoot/Mappers/OptionResponseMapper.ts

import { OptionResponseDTO } from "../../../application/response-dto/kahoot.slide.option.response.dto";
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
}