// Application/Kahoot/Mappers/KahootResponseMapper.ts (MODIFICADO)

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { KahootResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.response.dto";
import { IKahootResponseMapper } from "../../../../application/ports/i-kahoot.response.mapper";
import { SlideResponseMapper } from "./kahoot.slide.response.mapper";
import { MapperHelper } from '../../helpers/kahoot.mapper.helper';
import { QueryBus } from '@nestjs/cqrs'; 
import { GetAssetUrlQuery } from "src/media/application/queries/get-asset-url/get-asset-url-by-id.query"
import { Injectable } from "@nestjs/common";

@Injectable()
export class KahootResponseMapper implements IKahootResponseMapper {
    constructor(
        private readonly queryBus: QueryBus, // Inyectamos QueryBus
        private readonly slideResponseMapper: SlideResponseMapper, // Inyectamos el mapper de slides
    ) {}
    
    // El método toResponseDTO ahora es ASÍNCRONO
    public async toResponseDTO(domainEntity: Kahoot): Promise<KahootResponseDTO> {
        
        // --- 1. Extracción de Detalles ---
        const details = domainEntity.details.hasValue() 
            ? domainEntity.details.getValue() 
            : null;
            
        // --- 2. Mapear Imagen de Portada (coverImageId) ---
        const coverImageId = domainEntity.styling.imageId.hasValue() 
            ? domainEntity.styling.imageId.getValue().value 
            : null;
        
        let coverImageUrl = null;
        if (coverImageId) {
            // EJECUTAR EL QUERY: UUID -> URL
            coverImageUrl = await this.queryBus.execute(new GetAssetUrlQuery(coverImageId));
        }
            
        // --- 3. Extracción y Mapeo de Slides de forma ASÍNCRONA ---
        const slideValues = Array.from(domainEntity.slides.values());
        
        const slidesArray = slideValues.length > 0
            ? await Promise.all( // Usar AWAIT y Promise.all para mapear slides
                slideValues
                    .sort((a, b) => a.position - b.position) 
                    .map(slide => this.slideResponseMapper.toResponseDTO(slide)) // Usar el mapper inyectado
              )
            : null; 

        // --- 4. Mapeo de Propiedades ---
        return {
            // Propiedades Directas / VOs
            id: domainEntity.id.value, 
            authorId: domainEntity.authorId,
            createdAt: domainEntity.createdAt.value, 
            playCount: domainEntity.playCount.count, 
            
            // VOs que contienen Enum
            status: MapperHelper.capitalizeFirstLetter(domainEntity.status.value)!, // Usé status.value, no visibility.value
            visibility: MapperHelper.capitalizeFirstLetter(domainEntity.visibility.value)!, 
            
            // Mapeo de Styling (VO KahootStyling)
            themeId: domainEntity.styling.themeName, 
            coverImageId: coverImageUrl, // Ahora es la URL
            
            // Mapeo de Detalles (Optional<KahootDetails>)
            title: details && details.title.hasValue()
                ? details.title.getValue()
                : null,
            description: details && details.description.hasValue()
                ? details.description.getValue()
                : null,
            category: details && details.category.hasValue()
                ? details.category.getValue()
                : null,
                
            // Array de DTOs anidados
            questions: slidesArray, 
        };
    }
}