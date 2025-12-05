import { Slide } from "src/kahoots/domain/entities/kahoot.slide";
import { SlideResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.slide.response.dto";
import { OptionResponseMapper } from "./kahoot.slide.option.response.mapper";
import { QueryBus } from '@nestjs/cqrs'; 
import { GetAssetUrlQuery } from "src/media/application/queries/get-asset-url/get-asset-url-by-id.query";
import { Injectable } from "@nestjs/common";
import { OptionResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.slide.option.response.dto";

@Injectable()
export class SlideResponseMapper {
    constructor(
        private readonly queryBus: QueryBus, 
        private readonly optionResponseMapper: OptionResponseMapper, 
    ) {}

    public async toResponseDTO(slide: Slide): Promise<SlideResponseDTO> {
        // --- 1. Mapear opciones (answers) ---
        const options = slide.options.hasValue() 
            ? slide.options.getValue() 
            : null;
            
        let answersDTO: OptionResponseDTO[] | null = null;
        if (options && options.length > 0) {
            answersDTO = await Promise.all(
                options.map((option, index) => this.optionResponseMapper.toResponseDTO(option, index))
            );
        }

        // --- 2. Mapear imagen del slide ---
        const slideMediaId = slide.slideImage.hasValue() 
            ? slide.slideImage.getValue().value 
            : null;

        let slideMediaUrl: string | null = null;
        if (slideMediaId) {
            try {
                const result = await this.queryBus.execute(new GetAssetUrlQuery(slideMediaId));
                
                if (result.isLeft()) {
                    const error = result.getLeft();
                    if (error.type === 'AssetNotFound') {
                        console.warn(`Slide asset ${slideMediaId} no existe o no pertenece al CDN`);
                    } else {
                        console.warn(`Error obteniendo slide asset ${slideMediaId}:`, error.message);
                    }
                    slideMediaUrl = null;
                } else {
                    const url = result.getRight();
                    if (!url) {
                        console.warn(`Slide asset ${slideMediaId} no existe o no está disponible`);
                        slideMediaUrl = null;
                    } else {
                        slideMediaUrl = url;
                    }
                }
            } catch (error) {
                console.warn(`Error de conexión obteniendo slide asset ${slideMediaId}:`, error);
                slideMediaUrl = null;
            }
        }

        return {
            id: slide.id.value, 
            text: slide.question.hasValue() 
                ? slide.question.getValue().value 
                : null,
            mediaId: slideMediaUrl,
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