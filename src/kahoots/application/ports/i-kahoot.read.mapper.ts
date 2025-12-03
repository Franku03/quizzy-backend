import { KahootReadModel } from '../queries/read-model/kahoot.response.read.model';
import { KahootMongoInput } from 'src/kahoots/infrastructure/adapters/querys/output/kahoot.read.model.mapper';

export interface IKahootReadResponseMapper {
    mapToReadModel(kahootData: KahootMongoInput): KahootReadModel;
}