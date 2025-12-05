import { KahootReadModel } from '../queries/read-model/kahoot.response.read.model';
import { KahootMongoInput } from 'src/database/infrastructure/mongo/entities/kahoots.schema';

export interface IKahootReadResponseMapper {
    mapToReadModel(kahootData: KahootMongoInput): Promise<KahootReadModel>;
}