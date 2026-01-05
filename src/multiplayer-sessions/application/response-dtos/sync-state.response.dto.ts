import { SyncType } from "./enums/sync-type.enum";
import { SyncData } from "./types/sync-data.type";


export interface QuestionAdditionalData {
    timeRemaining: number;
    hasAnswered?: boolean;
}

export interface LobbydditionalData {
    isJoined: boolean
}

export interface SyncStateResponse { 

    type: SyncType

    data?: SyncData;

    // Para cualquier data extra que queramos adjuntar a la respuesta, como contexto adicional por ejemplo
    additionalData?: QuestionAdditionalData | LobbydditionalData

}