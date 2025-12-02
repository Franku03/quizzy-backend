import { MultiplayerSession } from '../../../../multiplayer-sessions/domain/aggregates/multiplayer-session';

export interface IMultiplayerSessionRepository {

    saveMultiplayerSession( session: MultiplayerSession ): Promise<void>
    
}