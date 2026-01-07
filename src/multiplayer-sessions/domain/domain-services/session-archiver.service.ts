import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "../aggregates/multiplayer-session";
import { IActiveMultiplayerSessionRepository, IMultiplayerSessionHistoryRepository } from "../ports";

export class SessionArchiverService {
    constructor(
        private historyRepo: IMultiplayerSessionHistoryRepository,
        private activeRepo: IActiveMultiplayerSessionRepository
    ){}

    async archiveAndClean( session: MultiplayerSession, kahoot: Kahoot ): Promise<void> {

        // validamos que todo este en orden antes de guardar y que no hayan inconsistencia
        session.validateAllInvariantsForCompletion();

        // TODO: Hacer mapeo de monadas Either desde la respuesta del saveSession
        await this.historyRepo.archiveSession(session, kahoot);
        
        // Liberamos el recurso de memoria
        await this.activeRepo.delete( session.getSessionPin() );
    }
}