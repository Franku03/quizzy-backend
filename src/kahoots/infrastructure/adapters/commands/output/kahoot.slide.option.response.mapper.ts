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
        
        let mediaUrl: string | null = null;
        if (mediaId) {
            try {
                const result = await this.queryBus.execute(new GetAssetUrlQuery(mediaId));
                
                if (result.isLeft()) {
                    const error = result.getLeft();
                    // Mensaje más específico
                    if (error.type === 'AssetNotFound') {
                        console.warn(`Asset ${mediaId} no existe o no pertenece al CDN`);
                    } else {
                        console.warn(`Error obteniendo URL para asset ${mediaId}:`, error.message);
                    }
                    mediaUrl = null;
                } else {
                    const url = result.getRight();
                    if (!url) {
                        console.warn(`Asset ${mediaId} no existe o no está disponible`);
                        mediaUrl = null;
                    } else {
                        mediaUrl = url;
                    }
                }
            } catch (error) {
                console.warn(`Error de conexión obteniendo asset ${mediaId}:`, error);
                mediaUrl = null;
            }
        }

        return {
            id: index.toString(),
            text: optionText,
            mediaId: mediaUrl,
            isCorrect: option.isCorrect,
        };
    }
}