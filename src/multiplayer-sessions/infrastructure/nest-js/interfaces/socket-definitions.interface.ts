/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\infrastructure\nest-js\interfaces\socket-definitions.interface.ts

import { Socket } from "socket.io";

import { 
  HostEndGameResponse, 
  HostLobbyUpdateResponse, 
  PlayerEndGameResponse, 
  PlayerLobbyUpdateResponse, 
  PlayerSubmitAnswerResponse, 
  QuestionResultsHostResponse, 
  QuestionResultsPlayerResponse, 
  QuestionStartedResponse 
} from "src/multiplayer-sessions/application/response-dtos";

import { SessionClosed } from "../dtos/session-closed.response.dto";
import { PlayerSubmitAnswerDto } from "../dtos/player-submit-answer.dto";
import { HostUserEvents, PlayerUserEvents, ServerErrorEvents, ServerEvents, ClientEvents } from '../enums/websocket.events.enum';

import { SessionRoles } from "../enums/session-roles.enum";
import { ThemeObject } from "src/core/types/theme.object";


// Eventos que el Servidor envía a los Clientes
export interface ServerToClientEvents { 
   // Eventos exitosos
  [ServerEvents.HOST_CONNECTED_SUCCESS]: (payload: { status: 'IN_LOBBY - CONNECTED TO SERVER' }) => void;
  [ServerEvents.PLAYER_CONNECTED_TO_SERVER]: (payload: { status: 'IN_LOBBY - CONNECTED TO SERVER', theme: ThemeObject }) => void;
  [ServerEvents.HOST_LOBBY_UPDATE]: (payload: HostLobbyUpdateResponse) => void;
  [ServerEvents.PLAYER_CONNECTED_TO_SESSION]: (payload: PlayerLobbyUpdateResponse ) => void;  
  [ServerEvents.QUESTION_STARTED]:(payload: QuestionStartedResponse) => void; 
  [ServerEvents.HOST_ANSWERS_UPDATE]:(payload: PlayerSubmitAnswerResponse ) => void; 

  [ServerEvents.PLAYER_ANSWER_CONFIRMATION]:(payload: { status: 'ANSWER SUCCESFULLY SUBMITTED' }) => void; 
  [ServerEvents.HOST_RESULTS]:(payload: QuestionResultsHostResponse ) => void;
  [ServerEvents.PLAYER_RESULTS]:(payload: QuestionResultsPlayerResponse ) => void;
  [ServerEvents.HOST_GAME_END]:(payload: HostEndGameResponse ) => void; 
  [ServerEvents.PLAYER_GAME_END]:(payload: PlayerEndGameResponse ) => void;
  [ServerEvents.PLAYER_LEFT_SESSION]:(payload: { userId: string, nickname: string, message: string}) => void; 
  [ServerEvents.HOST_LEFT_SESSION]:(payload: { message: string }) => void; 
  [ServerEvents.HOST_RETURNED_TO_SESSION]:(payload: { message: string }) => void; 
  [ServerEvents.SESSION_CLOSED]:(payload: SessionClosed ) => void; 


   // Errores
  // [ServerErrorEvents.FATAL_ERROR]: (payload: { statusCode: number, message: string }) => void;
  // [ServerErrorEvents.UNAVAILABLE_SESSION]: (payload: { statusCode: number, message: string }) => void;
  // [ServerErrorEvents.SYNC_ERROR]: (payload: { statusCode: number, message: string }) => void;

  [ServerErrorEvents.FATAL_ERROR]: (payload: ISocketErrorPayload) => void;
  [ServerErrorEvents.CONNECTION_ERROR]: (payload: ISocketErrorPayload) => void;
  [ServerErrorEvents.UNAVAILABLE_SESSION]: (payload: ISocketErrorPayload) => void;
  [ServerErrorEvents.SYNC_ERROR]: (payload: ISocketErrorPayload) => void;
  
}

// Eventos que los Clientes envían al Servidor
export interface ClientToServerEvents {

  [ClientEvents.CLIENT_READY]: () => void;

  [PlayerUserEvents.PLAYER_JOIN]: (payload: { nickname: string }) => void;
  [PlayerUserEvents.PLAYER_SUBMIT_ANSWER]: (payload: PlayerSubmitAnswerDto ) => void;

  [HostUserEvents.HOST_START_GAME]: (payload: {}) => void; // Se queda con JSON vacio por compatibilidad, pero no tendría por qué pasarle payload siquiera
  [HostUserEvents.HOST_NEXT_PHASE]: () => void;
  [HostUserEvents.HOST_END_SESSION]: () => void;


}


export interface SocketData {
    
    nickname: string,
    userId: string,
    roomPin: string
    role: SessionRoles,
    // isAuthenticated: boolean;
    
}

export interface ISocketErrorPayload {
  statusCode: number;
  message: string;
  error: string; // El tipo de error (ej: "Bad Request", "Internal Server Error")
}


// Comunicación entre Servidores (raramente se usa en apps sencillas)
export interface InterServerEvents {
  // Ej: Un servidor notifica a otro en un entorno multi-servidor (clustering)
  ping: () => void;
}


export type SessionSocket = Socket<ClientToServerEvents,ServerToClientEvents,InterServerEvents,SocketData>;