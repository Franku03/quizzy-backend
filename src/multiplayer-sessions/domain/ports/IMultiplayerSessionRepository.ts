import { MultiplayerSession } from '../aggregates/multiplayer-session';

export interface IMultiplayerSessionRepository {
  saveMultiplayerSession(session: MultiplayerSession): Promise<void>;
}
