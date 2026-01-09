import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "../aggregates/multiplayer-session";

import { Either } from '../../../core/types/either';
import { ErrorData } from "src/core/types";
import { KahootStylingSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.styling";

export interface ActiveSessionContext { 
    session: MultiplayerSession, 
    kahoot: Kahoot,
    sessionStyling: KahootStylingSnapshot
}

// repositorio para las operaciones de tiempo real (búsqueda por PIN, gestión de estado volátil).
export interface IActiveMultiplayerSessionRepository {

    // ========== LEGACY (NO TOCAR - Compatibilidad) ==========

    saveSession(sessionWraper: ActiveSessionContext): Promise<string>;
    findByPin(pin: string): Promise< ActiveSessionContext | null >;
    findByTemporalToken(token: string): Promise<ActiveSessionContext | null>;
    deleteSession(pin: string): Promise<void>;
    
    // ========== VERSION CON EITHER (ROP - Nueva Arquitectura) ==========
    saveSessionEither(sessionWraper: ActiveSessionContext): Promise< Either<ErrorData,string> >;
    findByPinEither(pin: string): Promise< Either<ErrorData, ActiveSessionContext> >;
    findByTemporalTokenEither(token: string): Promise< Either<ErrorData,ActiveSessionContext> >;
    deleteSessionEither(pin: string): Promise< Either<ErrorData,void> >;

}

