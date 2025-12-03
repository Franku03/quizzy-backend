import { MultiplayerSession } from '../aggregates/multiplayer-session';

export interface IMultiplayerSessionRepository {
  saveSession(session: MultiplayerSession): Promise<void>;
}
