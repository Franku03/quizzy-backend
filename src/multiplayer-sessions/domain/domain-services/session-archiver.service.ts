import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "../aggregates/multiplayer-session";
import { IActiveMultiplayerSessionRepository, IMultiplayerSessionHistoryRepository } from "../ports";
import { Either, ErrorData } from "src/core/types";

export class SessionArchiverService {
    constructor(
        private historyRepo: IMultiplayerSessionHistoryRepository,
        private activeRepo: IActiveMultiplayerSessionRepository
    ){}

    async archiveSession( session: MultiplayerSession, kahoot: Kahoot ): Promise<Either< ErrorData, void> > {

        // validamos que todo este en orden antes de guardar y que no hayan inconsistencia
        const isValidToArchive = session.validateAllInvariantsForCompletion();

        if( isValidToArchive.isLeft() )
            return isValidToArchive 
        

        const result = await this.historyRepo.archiveSessionEither(session, kahoot);

        if( result.isLeft() )
            return result 
        
        return Either.makeRight( undefined );
 
    }
}