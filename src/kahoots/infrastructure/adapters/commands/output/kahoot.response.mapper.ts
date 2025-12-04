// Application/Kahoot/Mappers/KahootResponseMapper.ts

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { KahootResponseDTO } from "src/kahoots/application/commands/response-dto/kahoot.response.dto";
import { IKahootResponseMapper } from "../../../../application/ports/i-kahoot.response.mapper";
import { SlideResponseMapper } from "./kahoot.slide.response.mapper";

export class KahootResponseMapper implements IKahootResponseMapper {
    
    toResponseDTO(domainEntity: Kahoot): KahootResponseDTO {
        
        // --- 1. Extracción de Detalles (Optional<KahootDetails>) ---
        const details = domainEntity.details.hasValue() 
            ? domainEntity.details.getValue() 
            : null;
            
        // --- 2. Extracción de Slides ---
        const slideValues = Array.from(domainEntity.slides.values());
        
        const slidesArray = slideValues.length > 0
            ? slideValues
                .sort((a, b) => a.position - b.position) 
                .map(slide => SlideResponseMapper.toResponseDTO(slide))
            : null; 

        // --- 3. Mapeo de Propiedades ---
        return {
            // Propiedades Directas / VOs
            id: domainEntity.id.value, 
            authorId: domainEntity.authorId,
            createdAt: domainEntity.createdAt.value, 
            playCount: domainEntity.playCount.count, 
            
            // VOs que contienen Enum
            status: domainEntity.status.value, 
            visibility: domainEntity.visibility.value, 
            
            // Mapeo de Styling (VO KahootStyling)
            themeId: domainEntity.styling.themeName, 
            coverImageId: domainEntity.styling.imageId.hasValue() 
                ? domainEntity.styling.imageId.getValue().value 
                : null,
            
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
                
            // Array de DTOs anidados: ahora será null si no hay slides
            questions: slidesArray, 
        };
    }
}