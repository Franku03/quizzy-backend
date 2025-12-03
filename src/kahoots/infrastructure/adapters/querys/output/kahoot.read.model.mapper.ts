import { Injectable } from '@nestjs/common';

import { KahootReadModel } from 'src/kahoots/application/queries/read-model/kahoot.response.read.model'; 
import { SlideReadModel } from 'src/kahoots/application/queries/read-model/kahoot.slide.response.read.model';
import { OptionReadModel } from 'src/kahoots/application/queries/read-model/kahoot.slide.option.response.read.model';
import { IKahootReadResponseMapper } from 'src/kahoots/application/ports/i-kahoot.read.mapper';


import { 
    OptionSnapshot, 
    SlideSnapshot, 
    KahootDetailsSnapshot, 
    KahootStylingSnapshot 
} from 'src/database/infrastructure/mongo/entities/kahoots.schema'; // RUTA ASUMIDA

/**
 * El tipo de entrada que el DAO le pasará al Mapper ().
 * Este tipo refleja la estructura de KahootMongo pero sin las propiedades internas de Mongoose.
 */
export type KahootMongoInput = {
    id: string;
    authorId: string;
    createdAt: string;
    visibility: string;
    status: string;
    playCount: number;
    details: KahootDetailsSnapshot | null; // Usa la CLASE importada
    styling: KahootStylingSnapshot;     // Usa la CLASE importada
    slides: SlideSnapshot[] | null;     // Usa la CLASE importada
};
// ----------------------------------------------------------------------------------------------------------

@Injectable()
export class KahootReadMapper implements IKahootReadResponseMapper {

    /**
     * Mapea las opciones (OptionSnapshot) al Modelo de Lectura (OptionReadModel).
     * @param optionsSnapshot Array de la estructura de persistencia de Opciones (Clase OptionSnapshot).
     */
    private mapOptionsToReadModel(optionsSnapshot: OptionSnapshot[] | null): OptionReadModel[] | null {
        if (!optionsSnapshot) return null;
        
        return optionsSnapshot.map((opt, index) => ({ 
            // El mapeo permanece igual, solo el tipo de entrada cambió a OptionSnapshot
            id: index.toString(), 
            text: opt.optionText ?? null,
            mediaId: opt.optionImageId ?? null,
            isCorrect: opt.isCorrect,
        } as OptionReadModel));
    }

    /**
     * Mapea las diapositivas (SlideSnapshot) al Modelo de Lectura (SlideReadModel).
     * @param slidesSnapshot Array de la estructura de persistencia de Slides (Clase SlideSnapshot).
     */
    private mapSlidesToReadModel(slidesSnapshot: SlideSnapshot[] | null): SlideReadModel[] | null {
        if (!slidesSnapshot) return null;

        return slidesSnapshot.map(slide => ({
            // El mapeo permanece igual, solo el tipo de entrada cambió a SlideSnapshot
            id: slide.id, 
            text: slide.questionText ?? null,
            mediaId: slide.slideImageId ?? null, 
            type: slide.slideType,
            timeLimit: slide.timeLimitSeconds,
            points: slide.pointsValue ?? null,
            position: slide.position,
            answers: this.mapOptionsToReadModel(slide.options), 
        } as SlideReadModel));
    }

    /**
     * Método principal para transformar el POJO de la DB (KahootMongoInput) al DTO final (KahootReadModel).
     */
    public mapToReadModel(kahootData: KahootMongoInput): KahootReadModel {
        const details = kahootData.details;
        const styling = kahootData.styling;
        const slidesRaw = kahootData.slides;
        
        const mappedQuestions = this.mapSlidesToReadModel(slidesRaw);

        // Creación del Read Model
        const readModel = new KahootReadModel();
        
        readModel.id = kahootData.id;
        readModel.title = details?.title ?? null; 
        readModel.description = details?.description ?? null;
        readModel.coverImageId = styling.imageId ?? null;
        readModel.visibility = kahootData.visibility;
        readModel.themeId = styling.themeId;
        readModel.authorId = kahootData.authorId;
        readModel.createdAt = kahootData.createdAt;
        readModel.playCount = kahootData.playCount;
        readModel.category = details?.category ?? null;
        readModel.status = kahootData.status;
        readModel.questions = mappedQuestions;

        return readModel;
    }
}