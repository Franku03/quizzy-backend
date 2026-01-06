import { MultiplayerSession } from "../aggregates/multiplayer-session";
import { IActiveMultiplayerSessionRepository, IMultiplayerSessionHistoryRepository } from "../ports";

export class SessionArchiverService {
    constructor(
        private historyRepo: IMultiplayerSessionHistoryRepository,
        private activeRepo: IActiveMultiplayerSessionRepository
    ){}

    async archiveAndClean(session: MultiplayerSession): Promise<void> {

        // validamos que todo este en orden antes de guardar y que no hayan inconsistencia
        session.validateAllInvariantsForCompletion();

        // TODO: Hacer mapeo de monadas Either desde la respuesta del saveSession
        await this.historyRepo.archiveSession(session);
        
        // Liberamos el recurso de memoria
        await this.activeRepo.delete( session.getSessionPin() );
    }
}