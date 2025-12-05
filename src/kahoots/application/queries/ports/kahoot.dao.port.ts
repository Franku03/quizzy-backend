import { Optional } from 'src/core/types/optional';
import { KahootReadModel } from '../read-model/kahoot.response.read.model';
import { Either } from 'src/core/types/either';
import { RepositoryError } from 'src/database/domain/repository';

export interface IKahootDao {
    getKahootById(id: string): Promise<Either<RepositoryError, Optional<KahootReadModel>>>;
}