// src/kahoots/infrastructure/mappers/kahoot.read.mapper.ts
import { Injectable } from '@nestjs/common';
import { KahootReadModel } from 'src/kahoots/application/queries/read-model/kahoot.response.read.model'; 
import { SlideReadModel } from 'src/kahoots/application/queries/read-model/kahoot.slide.response.read.model';
import { OptionReadModel } from 'src/kahoots/application/queries/read-model/kahoot.slide.option.response.read.model';
import { IKahootReadResponseMapper } from 'src/kahoots/application/ports/i-kahoot.read.mapper';
import { OptionSnapshot, SlideSnapshot, KahootDetailsSnapshot, KahootStylingSnapshot } from 'src/database/infrastructure/mongo/entities/kahoots.schema';
import { MapperHelper } from '../../helpers/kahoot.mapper.helper';

import { QueryBus } from '@nestjs/cqrs';
import { GetAssetUrlQuery } from 'src/media/application/queries/get-asset-url/get-asset-url-by-id.query';

export type KahootMongoInput = {
    id: string;
    authorId: string;
    createdAt: string;
    visibility: string;
    status: string;
    playCount: number;
    details: KahootDetailsSnapshot | null;
    styling: KahootStylingSnapshot;
    slides: SlideSnapshot[] | null;
};

@Injectable()
export class KahootReadMapper implements IKahootReadResponseMapper {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Obtiene la URL de un asset de forma segura.
     * Si falla, retorna null pero NO detiene el proceso.
     */
    private async getAssetUrlSafe(mediaId: string | null | undefined): Promise<string | null> {
        if (!mediaId) return null;
        
        try {
            const result = await this.queryBus.execute(new GetAssetUrlQuery(mediaId));
            
            if (result.isRight()) {
                return result.getRight(); 
            }
            
            // Si hay error, simplemente log y retorna null
            console.warn(`No se pudo obtener URL para mediaId ${mediaId}:`, result.getLeft());
            return null;
            
        } catch (error) {
            // Captura cualquier error inesperado y continúa
            console.warn(`Error inesperado obteniendo URL para mediaId ${mediaId}:`, error);
            return null;
        }
    }

    /**
     * Mapea las opciones incluyendo URLs de imágenes de forma segura.
     */
    private async mapOptionsToReadModel(optionsSnapshot: OptionSnapshot[] | null): Promise<OptionReadModel[] | null> {
        if (!optionsSnapshot) return null;
        
        // Mapea todas las opciones en paralelo
        const mappedOptions = await Promise.all(
            optionsSnapshot.map(async (opt, index) => {
                const optionImageUrl = await this.getAssetUrlSafe(opt.optionImageId);
                
                return {
                    id: index.toString(),
                    text: opt.optionText ?? null,
                    mediaId: optionImageUrl, // ✅ Asigna la URL directamente (no el ID)
                    isCorrect: opt.isCorrect,
                } as OptionReadModel;
            })
        );
        
        return mappedOptions;
    }

    /**
     * Mapea las diapositivas incluyendo URLs de imágenes de forma segura.
     */
    private async mapSlidesToReadModel(slidesSnapshot: SlideSnapshot[] | null): Promise<SlideReadModel[] | null> {
        if (!slidesSnapshot) return null;

        // Mapea todas las slides en paralelo
        const mappedSlides = await Promise.all(
            slidesSnapshot.map(async (slide) => {
                const slideImageUrl = await this.getAssetUrlSafe(slide.slideImageId);
                
                // Mapea las opciones de esta slide
                const answers = await this.mapOptionsToReadModel(slide.options);
                
                return {
                    id: slide.id,
                    text: slide.questionText ?? null,
                    mediaId: slideImageUrl, // ✅ Asigna la URL directamente (no el ID)
                    type: slide.slideType.toLowerCase(),
                    timeLimit: slide.timeLimitSeconds,
                    points: slide.pointsValue ?? null,
                    position: slide.position,
                    answers,
                } as SlideReadModel;
            })
        );

        return mappedSlides;
    }

    /**
     * Método principal - ahora es async para manejar las URLs
     */
    public async mapToReadModel(kahootData: KahootMongoInput): Promise<KahootReadModel> {
        const details = kahootData.details;
        const styling = kahootData.styling;
        const slidesRaw = kahootData.slides;
        const coverImageUrl = await this.getAssetUrlSafe(styling?.imageId);
        const mappedQuestions = await this.mapSlidesToReadModel(slidesRaw);
        const readModel = new KahootReadModel();
        
        readModel.id = kahootData.id;
        readModel.title = details?.title ?? null; 
        readModel.description = details?.description ?? null;
        readModel.coverImageId = coverImageUrl;
        readModel.visibility = MapperHelper.capitalizeFirstLetter(kahootData.visibility)!;
        readModel.themeId = styling?.themeId ?? null;
        readModel.authorId = kahootData.authorId;
        readModel.createdAt = kahootData.createdAt;
        readModel.playCount = kahootData.playCount;
        readModel.category = details?.category ?? null;
        readModel.status = MapperHelper.capitalizeFirstLetter(kahootData.status)!;
        readModel.questions = mappedQuestions;

        return readModel;
    }
}