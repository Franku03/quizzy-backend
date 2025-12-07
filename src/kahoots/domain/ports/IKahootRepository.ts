// src/kahoot/domain/ports/out/kahoot-repository.interface.ts (versión simplificada)
import { Optional } from 'src/core/types/optional';
import { Kahoot } from '../aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { OptionalRepositoryResult, RepositoryResult } from 'src/core/types/repository-result.type';

export interface IKahootRepository {
  // CRUD básico
  saveKahoot(kahoot: Kahoot): Promise<void>;
  findKahootById(id: KahootId): Promise<Optional<Kahoot>>;
  findAllKahoots(): Promise<Kahoot[]>;
  deleteKahoot(id: KahootId): Promise<void>;
  
  // CRUD con Either
  saveKahootEither(kahoot: Kahoot): Promise<RepositoryResult<void>>;
  findKahootByIdEither(id: KahootId): Promise<OptionalRepositoryResult<Kahoot>>;
  findAllKahootsEither(): Promise<RepositoryResult<Kahoot[]>>;
  deleteKahootEither(id: KahootId): Promise<RepositoryResult<void>>;
  
  // Métodos adicionales con Either
  existsKahootEither(id: KahootId): Promise<RepositoryResult<boolean>>;
}