import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "../aggregates/multiplayer-session";

export interface ActiveSessionContext { 
    session: MultiplayerSession, 
    kahoot: Kahoot,
}

// repositorio para las operaciones de tiempo real (búsqueda por PIN, gestión de estado volátil).
export interface IActiveMultiplayerSessionRepository {

    saveSession(sessionWraper: ActiveSessionContext): Promise<string>;
    findByPin(pin: string): Promise<ActiveSessionContext| null>;
    findByTemporalToken(token: string): Promise<ActiveSessionContext | null>;
    delete(pin: string): Promise<void>;
    IsUserSessionHost( pin: string, userId: string ): Promise<boolean>;
}

