import { Injectable } from '@nestjs/common';

// Modelos de Lectura (Read Models)
import { KahootReadModel } from 'src/kahoots/application/queries/read-model/kahoot.response.read.model'; 
import { SlideReadModel } from 'src/kahoots/application/queries/read-model/kahoot.slide.response.read.model';
import { OptionReadModel } from 'src/kahoots/application/queries/read-model/kahoot.slide.option.response.read.model';
import { IKahootReadResponseMapper } from 'src/kahoots/application/ports/i-kahoot.read.mapper';

// --- TIPOS DE PERSISTENCIA (Mantenemos estos tipos aquí para encapsular el conocimiento de la persistencia) ---

type OptionPersistenceType = {
    optionText: string | null;
    isCorrect: boolean;
    optionImageId: string | null;
};

type SlidePersistenceType = {
    id: string;
    position: number;
    slideType: string;
    timeLimitSeconds: number;
    questionText: string | null;
    slideImageId: string | null;
    pointsValue: number | null;
    descriptionText: string | null;
    options: OptionPersistenceType[] | null;
};

type KahootDetailsSnapshotType = {
    title: string | null;
    description: string | null;
    category: string | null;
};

type KahootStylingSnapshotType = {
    themeId: string;
    imageId: string | null;
};

// El tipo de entrada que el DAO le pasará al Mapper (el POJO obtenido de Mongoose .lean())
export type KahootMongoInput = {
    id: string;
    authorId: string;
    createdAt: string;
    visibility: string;
    status: string;
    playCount: number;
    details: KahootDetailsSnapshotType | null; 
    styling: KahootStylingSnapshotType; 
    slides: SlidePersistenceType[] | null; 
};
// ----------------------------------------------------------------------------------------------------------

@Injectable()
export class KahootReadMapper implements IKahootReadResponseMapper {

    private mapOptionsToReadModel(optionsSnapshot: OptionPersistenceType[] | null): OptionReadModel[] | null {
        if (!optionsSnapshot) return null;
        
        return optionsSnapshot.map((opt, index) => ({ 
            id: index.toString(), // Mapeo de índice a ID (o lo que corresponda)
            text: opt.optionText ?? null,
            mediaId: opt.optionImageId ?? null,
            isCorrect: opt.isCorrect,
        } as OptionReadModel));
    }

    private mapSlidesToReadModel(slidesSnapshot: SlidePersistenceType[] | null): SlideReadModel[] | null {
        if (!slidesSnapshot) return null;

        return slidesSnapshot.map(slide => ({
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