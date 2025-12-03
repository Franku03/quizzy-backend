/*import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Optional } from 'src/core/types/optional';
import { IKahootDao } from 'src/kahoots/application/queries/ports/kahoot.dao.port'; 

import { KahootReadModel } from 'src/kahoots/application/queries/read-model/kahoot.response.read.model'; 
import { KahootMongo } from '../../entities/kahoots.schema';
import { KahootReadMapper,KahootMongoInput } from 'src/kahoots/infrastructure/adapters/querys/output/kahoot.read.model.mapper'; 


@Injectable()
export class KahootDaoMongo implements IKahootDao {
    
    constructor(
        @InjectModel(KahootMongo.name) 
        private readonly kahootModel: Model<KahootMongo>,
        @Inject(KahootReadModel)
        private readonly kahootReadMapper: KahootReadMapper,

    ) {}
    
    
    async getKahootById(id: string): Promise<Optional<KahootReadModel>> {
        const documentResult = await this.kahootModel.findOne({ id: id }).lean().exec();
        
        if (!documentResult) {
            return new Optional<KahootReadModel>();
        }
        
        const kahootData = documentResult as unknown as KahootMongoInput;

        const readModel = this.kahootReadMapper.mapToReadModel(kahootData);
        
        return new Optional<KahootReadModel>(readModel);
    }
}*/


import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Optional } from 'src/core/types/optional';
import { IKahootDao } from 'src/kahoots/application/queries/ports/kahoot.dao.port'; 

import { KahootReadModel } from 'src/kahoots/application/queries/read-model/kahoot.response.read.model'; 
import { KahootMongo } from '../../entities/kahoots.schema';
import { KahootReadMapper,KahootMongoInput } from 'src/kahoots/infrastructure/adapters/querys/output/kahoot.read.model.mapper'; 


@Injectable()
export class KahootDaoMongo implements IKahootDao {
    
    private readonly kahootReadMapper: KahootReadMapper = new KahootReadMapper();;

    constructor(
        @InjectModel(KahootMongo.name) 
        private readonly kahootModel: Model<KahootMongo>,

    ) {}
    
    async getKahootById(id: string): Promise<Optional<KahootReadModel>> {
        const documentResult = await this.kahootModel.findOne({ id: id }).lean().exec();
        
        if (!documentResult) {
            return new Optional<KahootReadModel>();
        }
        
        const kahootData = documentResult as unknown as KahootMongoInput;

        const readModel = this.kahootReadMapper.mapToReadModel(kahootData);
        
        return new Optional<KahootReadModel>(readModel);
    }
}


/*import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Optional } from 'src/core/types/optional';
import { IKahootDao } from 'src/kahoots/application/queries/ports/kahoot.dao.port';
import { KahootReadModel } from 'src/kahoots/application/queries/read-model/kahoot.response.read.model';
import { SlideReadModel } from 'src/kahoots/application/queries/read-model/kahoot.slide.response.read.model';
import { OptionReadModel } from 'src/kahoots/application/queries/read-model/kahoot.slide.option.response.read.model';
import { KahootMongo } from '../../entities/kahoots.schema';

// --- TIPOS DE PERSISTENCIA ---

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


class KahootReadMapperLogic {
    private mapOptionsToReadModel(optionsSnapshot: OptionPersistenceType[] | null): OptionReadModel[] | null {
        if (!optionsSnapshot) return null;
        
        return optionsSnapshot.map((opt, index) => ({ 
            id: index.toString(),
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

@Injectable()
export class KahootDaoMongo implements IKahootDao {
    
    private readonly kahootReadMapper: KahootReadMapperLogic;

    constructor(
        @InjectModel(KahootMongo.name) 
        private readonly kahootModel: Model<KahootMongo>,
    ) {
        this.kahootReadMapper = new KahootReadMapperLogic();
    }
    
    async getKahootById(id: string): Promise<Optional<KahootReadModel>> {
        const documentResult = await this.kahootModel.findOne({ id: id }).lean().exec();
        
        if (!documentResult) {
            return new Optional<KahootReadModel>();
        }
        
        const kahootData = documentResult as unknown as KahootMongoInput;

        const readModel = this.kahootReadMapper.mapToReadModel(kahootData);
        
        return new Optional<KahootReadModel>(readModel);
    }
}*/