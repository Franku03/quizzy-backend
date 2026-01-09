import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { MultiplayerSession } from '../aggregates/multiplayer-session';
import { Either, ErrorData } from 'src/core/types';

// Repositorio para las operaciones de larga duración que involucran persistencia (guardado final).
export interface IMultiplayerSessionHistoryRepository {
  
  // ========== LEGACY (NO TOCAR) ==========
  archiveSession(session: MultiplayerSession, kahoot: Kahoot ): Promise<void>;

  // ========== VERSION ROP CON EITHER ==========
  archiveSessionEither(session: MultiplayerSession, kahoot: Kahoot ): Promise<Either<ErrorData, void>>
  
}
