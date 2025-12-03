import { Optional } from 'src/core/types/optional';
import { KahootReadModel } from '../read-model/kahoot.response.read.model';

export interface IKahootDao {
    getKahootById(id: string): Promise<Optional<KahootReadModel>>;
}