import { Socket } from "socket.io";

import { GameStateUpdateResponse } from "src/multiplayer-sessions/application/response-dtos/game-state-update.response.dto";
import { SessionRoles } from "../enums/session-roles.enum";
import { ServerErrorEvents, ServerEvents } from '../enums/websocket.events.enum';
import { QuestionStartedResponse } from "src/multiplayer-sessions/application/response-dtos/question-started.response";

// En un archivo de tipos común, por ejemplo: src/common/interfaces/socket.interface.ts

// 1) Eventos que el Servidor envía a los Clientes
export interface ServerToClientEvents { 
   // Eventos exitosos
  [ServerEvents.HOST_CONNECTED_SUCCESS]: (payload: { status: 'IN_LOBBY - CONNECTED TO SERVER' }) => void;
  [ServerEvents.PLAYER_CONNECTED_TO_SERVER]: (payload: { status: 'IN_LOBBY - CONNECTED TO SERVER' }) => void;
  [ServerEvents.GAME_STATE_UPDATE]: (payload: GameStateUpdateResponse) => void;
  [ServerEvents.PLAYER_CONNECTED_TO_SESSION]: (payload: { status: 'CONNECTED TO SESSION AS PLAYER' }) => void;  
  [ServerEvents.QUESTION_STARTED]:(payload: QuestionStartedResponse) => void; 

   // Errores
  [ServerErrorEvents.FATAL_ERROR]: (payload: { statusCode: number, message: string }) => void;
  [ServerErrorEvents.UNAVAILABLE_SESSION]: (payload: { statusCode: number, message: string }) => void;
  // ... más eventos que el servidor emite
}

// 2) Eventos que los Clientes envían al Servidor
export interface ClientToServerEvents {
  'joinRoom': (payload: { roomId: string, pin: string }) => void;
  'createRoom': (payload: { kahootId: string, hostId: string }) => void;
  'playerMove': (payload: { x: number, y: number }) => void;
  // ... más eventos que el cliente emite
}


export interface SocketData {
    
    nickname: string,
    userId: string,
    roomPin: string
    role: SessionRoles,
    // isAuthenticated: boolean;
    
}


// 4) Comunicación entre Servidores (raramente se usa en apps sencillas)
export interface InterServerEvents {
  // Ej: Un servidor notifica a otro en un entorno multi-servidor (clustering)
  ping: () => void;
}


export type SessionSocket = Socket<ClientToServerEvents,ServerToClientEvents,InterServerEvents,SocketData>;