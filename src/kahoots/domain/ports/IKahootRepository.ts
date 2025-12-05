import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { Either } from 'src/core/types/either';
import { Optional } from 'src/core/types/optional';
import { RepositoryError } from 'src/database/domain/repository';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';

export interface IKahootRepository {
  saveKahoot(kahoot: Kahoot): Promise<void>;
  findKahootById(id: KahootId): Promise<Optional<Kahoot>>;
  findAllKahoots(): Promise<Kahoot[]>;
  deleteKahoot(id: KahootId): Promise<void>;

  //Esto es para futuras iteraciones
  findAllKahootsEither(): Promise<Either<RepositoryError, Kahoot[]>>
  deleteKahootEither(id: KahootId): Promise<Either<RepositoryError, void>>
  findKahootByIdEither(id: KahootId): Promise<Either<RepositoryError, Optional<Kahoot>>>
  saveKahootEither(kahoot: Kahoot): Promise<Either<RepositoryError, void>>
}
