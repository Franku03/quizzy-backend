import { Either, ErrorData } from "src/core/types";
import { HostSessionDetailsReadModel } from "../queries/read-models/host.session.details.read.model";
import { PlayerSessionDetailsReadModel } from '../queries/read-models/player.session.details.read.model';
import { UserGameReportDetails } from '../queries/read-models/user.report.detailts.read.model';

export interface IMultiplayerSessionDao {

    getHostDetailsById( sessionId: string, hostId: string  ): Promise<Either<ErrorData, HostSessionDetailsReadModel | null>>;
    getPlayerDetailsById( sessionId: string, playerId: string): Promise<Either<ErrorData, PlayerSessionDetailsReadModel | null>>;
    getUserSessionDetailsById( userId: string, limit: number, page: number ): Promise< Either<ErrorData, UserGameReportDetails | null> >;
    isUserSessionHost( userId: string, sessionId: string ): Promise< Either<ErrorData, boolean> >;
    isUserSessionPlayer(userId: string, sessionId: string): Promise<Either<ErrorData, boolean>>;
    
}