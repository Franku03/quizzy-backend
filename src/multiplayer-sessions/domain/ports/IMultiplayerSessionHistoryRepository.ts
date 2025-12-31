import { MultiplayerSession } from '../aggregates/multiplayer-session';

// Repositorio para las operaciones de larga duración que involucran persistencia (guardado final).
export interface IMultiplayerSessionHistoryRepository {
  archiveSession(session: MultiplayerSession): Promise<void>;
}
