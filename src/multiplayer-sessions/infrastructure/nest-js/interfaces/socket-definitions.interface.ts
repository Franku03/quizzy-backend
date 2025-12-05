import { Socket } from "socket.io";

import { GameStateUpdateResponse } from "src/multiplayer-sessions/application/response-dtos/game-state-update.response.dto";
import { QuestionStartedResponse } from "src/multiplayer-sessions/application/response-dtos/question-started.response.dto";
import { QuestionResultsResponse } from "src/multiplayer-sessions/application/response-dtos/question-results.response.dto";

import { SessionRoles } from "../enums/session-roles.enum";
import { HostUserEvents, PlayerUserEvents, ServerErrorEvents, ServerEvents } from '../enums/websocket.events.enum';
import { PlayerSubmitAnswerDto } from "../dtos/player-submit-answer.dto";
import { GameEndedResponse } from "src/multiplayer-sessions/application/response-dtos/game-ended.response.dto";


// Eventos que el Servidor envía a los Clientes
export interface ServerToClientEvents { 
   // Eventos exitosos
  [ServerEvents.HOST_CONNECTED_SUCCESS]: (payload: { status: 'IN_LOBBY - CONNECTED TO SERVER' }) => void;
  [ServerEvents.PLAYER_CONNECTED_TO_SERVER]: (payload: { status: 'IN_LOBBY - CONNECTED TO SERVER' }) => void;
  [ServerEvents.GAME_STATE_UPDATE]: (payload: GameStateUpdateResponse) => void;
  [ServerEvents.PLAYER_CONNECTED_TO_SESSION]: (payload: { status: 'CONNECTED TO SESSION AS PLAYER' }) => void;  
  [ServerEvents.QUESTION_STARTED]:(payload: QuestionStartedResponse) => void; 
  [ServerEvents.PLAYER_ANSWER_CONFIRMATION]:(payload: { status: 'ANSWER SUCCESFULLY SUBMITTED' }) => void; 
  [ServerEvents.QUESTION_RESULTS]:(payload: QuestionResultsResponse ) => void; 
  [ServerEvents.GAME_END]:(payload: GameEndedResponse ) => void; 

   // Errores
  [ServerErrorEvents.FATAL_ERROR]: (payload: { statusCode: number, message: string }) => void;
  [ServerErrorEvents.UNAVAILABLE_SESSION]: (payload: { statusCode: number, message: string }) => void;
  // ... más eventos que el servidor emite
}

// Eventos que los Clientes envían al Servidor
export interface ClientToServerEvents {
  [PlayerUserEvents.PLAYER_JOIN]: (payload: {}) => void;
  [PlayerUserEvents.PLAYER_SUBMIT_ANSWER]: (payload: PlayerSubmitAnswerDto ) => void;

  [HostUserEvents.HOST_START_GAME]: (payload: {}) => void;
  // ... más eventos que el cliente emite
}


export interface SocketData {
    
    nickname: string,
    userId: string,
    roomPin: string
    role: SessionRoles,
    // isAuthenticated: boolean;
    
}


// Comunicación entre Servidores (raramente se usa en apps sencillas)
export interface InterServerEvents {
  // Ej: Un servidor notifica a otro en un entorno multi-servidor (clustering)
  ping: () => void;
}


export type SessionSocket = Socket<ClientToServerEvents,ServerToClientEvents,InterServerEvents,SocketData>;