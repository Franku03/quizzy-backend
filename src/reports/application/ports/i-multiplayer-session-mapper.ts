import { MultiplayerSessionEntity } from "src/database/infrastructure/postgres/entities/multiplayer-session.entity.pg"
import { HostSessionDetailsReadModel } from "../queries/read-models/host.session.details.read.model"
import { UserResult } from "../queries/read-models/user.report.detailts.read.model"
import { PlayerSessionDetailsReadModel } from "../queries/read-models/player.session.details.read.model"

export interface MultiplayerSessionMapper<I, O> {

    mapHostDetails(session: I ): O;
    mapPlayerDetails(session: I, playerId: string ): O | null;
    mapUserDetails(session: I, userId: string): O;
    
}