import { Inject, Injectable } from '@nestjs/common';
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
        @Inject()
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
}