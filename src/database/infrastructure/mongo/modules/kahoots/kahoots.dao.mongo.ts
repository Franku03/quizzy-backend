// src/kahoots/infrastructure/dao/kahoot.dao.mongo.ts
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IKahootDao } from 'src/kahoots/application/queries/ports/kahoot.dao.port';
import { Optional } from 'src/core/types/optional';
import { KahootReadModel } from 'src/kahoots/application/queries/read-model/kahoot.response.read.model';
import { KahootMongo, KahootMongoInput } from 'src/database/infrastructure/mongo/entities/kahoots.schema';
import { KahootReadMapper } from 'src/kahoots/infrastructure/adapters/querys/output/kahoot.read.model.mapper';
import { Either } from 'src/core/types/either';
import { RepositoryError } from 'src/database/domain/repository';
import { MongoErrorAdapter } from 'src/database/infrastructure/errors/mongo.error.adapter';
import { QueryBus } from '@nestjs/cqrs';

@Injectable()
export class KahootDaoMongo implements IKahootDao {
    
    private kahootReadMapper: KahootReadMapper;

    constructor(
        @InjectModel(KahootMongo.name) 
        private readonly kahootModel: Model<KahootMongo>,
        @Inject(QueryBus)
        private readonly queryBus: QueryBus,
    ) {}
    
    async getKahootById(id: string): Promise<Either<RepositoryError, Optional<KahootReadModel>>> {

        this.kahootReadMapper = new KahootReadMapper(this.queryBus);
        try {
            const documentResult = await this.kahootModel
                .findOne({ id: id })
                .lean()
                .exec();
            
            if (!documentResult) {
                return Either.makeRight(new Optional<KahootReadModel>());
            }
            
            const kahootData = documentResult as unknown as KahootMongoInput;
            const readModel = await this.kahootReadMapper.mapToReadModel(kahootData);
            
            return Either.makeRight(new Optional<KahootReadModel>(readModel));
            
        } catch (error) {
            const repositoryError = MongoErrorAdapter.toRepositoryError(
                error,
                'kahoots',
                'getKahootById',
                id
            );
            
            return Either.makeLeft(repositoryError);
        }
    }
}