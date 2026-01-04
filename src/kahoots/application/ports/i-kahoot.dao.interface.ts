// src/kahoots/application/queries/ports/kahoot.dao.port.ts
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { Either, ErrorData } from 'src/core/types'; 

export interface IKahootDao {
  getKahootById(id: string): Promise<Either<ErrorData, KahootSnapshot | null>>;
}
