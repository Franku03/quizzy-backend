import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { Optional } from 'src/core/types/optional';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';

export interface IKahootRepository {
  saveKahoot(kahoot: Kahoot): Promise<void>;
  findKahootById(id: KahootId): Promise<Optional<Kahoot>>;
  findAllKahoots(): Promise<Kahoot[]>;
  deleteKahoot(id: KahootId): Promise<void>;
}
