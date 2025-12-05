// Application/Kahoot/Mappers/KahootResponseMapper.ts (MODIFICADO)

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { KahootResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.response.dto";
import { IKahootResponseMapper } from "../../../../application/ports/i-kahoot.response.mapper";
import { SlideResponseMapper } from "./kahoot.slide.response.mapper";
import { MapperHelper } from '../../helpers/kahoot.mapper.helper';
import { QueryBus } from '@nestjs/cqrs'; 
import { GetAssetUrlQuery } from "src/media/application/queries/get-asset-url/get-asset-url-by-id.query"
import { Injectable } from "@nestjs/common";
import { SlideResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.slide.response.dto";

@Injectable()
export class KahootResponseMapper implements IKahootResponseMapper {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly slideResponseMapper: SlideResponseMapper, 
    ) {}
    
    public async toResponseDTO(kahoot: Kahoot): Promise<KahootResponseDTO> {
        const details = kahoot.details.hasValue() 
            ? kahoot.details.getValue() 
            : null;
            
        const coverImageId = kahoot.styling.imageId.hasValue() 
            ? kahoot.styling.imageId.getValue().value 
            : null;
        
        let coverImageUrl = null;
        if (coverImageId) {
            try {
                const result = await this.queryBus.execute(new GetAssetUrlQuery(coverImageId));
                
                if (result.isLeft()) {
                    const error = result.getLeft();
                    if (error.type === 'AssetNotFound') {
                        console.warn(`Cover asset ${coverImageId} no existe o no pertenece al CDN`);
                    } else {
                        console.warn(`Error obteniendo cover asset ${coverImageId}:`, error.message);
                    }
                    coverImageUrl = null;
                } else {
                    const url = result.getRight();
                    if (!url) {
                        console.warn(`Cover asset ${coverImageId} no existe o no está disponible`);
                        coverImageUrl = null;
                    } else {
                        coverImageUrl = url;
                    }
                }
            } catch (error) {
                console.warn(`Error de conexión obteniendo cover asset ${coverImageId}:`, error);
                coverImageUrl = null;
            }
        }
            
        const slideValues = Array.from(kahoot.slides.values());
        
        let slidesArray: SlideResponseDTO[] | null = null;
        if (slideValues.length > 0) {
            slidesArray = await Promise.all(
                slideValues
                    .sort((a, b) => a.position - b.position) 
                    .map(slide => this.slideResponseMapper.toResponseDTO(slide))
            );
        }

        return {
            id: kahoot.id.value, 
            authorId: kahoot.authorId,
            createdAt: kahoot.createdAt.value, 
            playCount: kahoot.playCount.count, 
            
            status: MapperHelper.capitalizeFirstLetter(kahoot.status.value)!,
            visibility: MapperHelper.capitalizeFirstLetter(kahoot.visibility.value)!, 
            
            themeId: kahoot.styling.themeName, 
            coverImageId: coverImageUrl,
            
            title: details?.title.hasValue() ? details.title.getValue() : null,
            description: details?.description.hasValue() ? details.description.getValue() : null,
            category: details?.category.hasValue() ? details.category.getValue() : null,
            
            questions: slidesArray, 
        };
    }
}