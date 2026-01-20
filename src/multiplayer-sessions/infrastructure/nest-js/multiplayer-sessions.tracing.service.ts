/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\infrastructure\nest-js\multiplayer-sessions.tracing.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { SessionRoles } from './enums/session-roles.enum';
import { SessionSocket } from './interfaces/socket-definitions.interface';

interface ConnectedClients {

    [id: string]: {

        socket: SessionSocket,
        roomPin: string
        role: SessionRoles, 

        // Para el Jugador
        nickname?: string,
        
        // Para el Host
        userId?: string,
        socketId?: string,

    } | undefined

}

@Injectable()
export class MultiplayerSessionsTracingService {

    private readonly logger: Logger = new Logger('QuizzySessions');
    
    private availableRooms: Map<string, ConnectedClients> = new Map<string, ConnectedClients>();


    // --------------------------------------------------------------------------
    // * Métodos de registro para trazabiblidad
    // --------------------------------------------------------------------------

    registerRoom( client: SessionSocket ){

        const roomPin = client.handshake.headers.pin as string;

        if( this.availableRooms.has( roomPin ))
            return //La sala ya existe, no deberíamos volverla a registrarla causando su borrado

        this.availableRooms.set( roomPin, {} );

    }

    registerClient( client: SessionSocket ): void {


        const roomPin = client.data.roomPin;

        const role = client.data.role

        const room = this.getRoom( roomPin );

        if(!room)
            return

        if( role === SessionRoles.HOST ){

            room["host"] = {
                socket: client,
                roomPin: roomPin,
                role: role,  
                userId: client.data.userId,
                socketId: client.id as string 
            }

        } else {

            room[ client.id as string ] = {
                socket: client,
                roomPin: roomPin,
                role: role,  
            };


        }

    } 

    registerClientNickname( client: SessionSocket ): void {

        const room = this.getRoom( client.data.roomPin );

        if(!room)
            return

        const clientInRoom = room[ client.id ];

        if( clientInRoom )
            clientInRoom.nickname = client.data.nickname;

    }

    // --------------------------------------------------------------------------
    // * Métodos de eliminación de registros
    // --------------------------------------------------------------------------


    removeClient( roomPin: string, clientId: string){

        const room = this.getRoom( roomPin );

        // IMPORTANTE: Si no encontramos sala para este cliente, 
        // significa que nunca se registró correctamente o ya se borró.
        // Simplemente retornamos sin hacer nada (return), NO lanzamos error.
        if(!room)
            return;

        delete room[ clientId ];
    }


    removeHost( roomPin: string ) {

        const room = this.getRoom( roomPin );

        if(!room)
            return;

        delete room["host"];
    }



    removeRoom( roomPin: string ){

        const roomExists = this.availableRooms.has( roomPin );

        // IMPORTANTE: Si no encontramos sala para este cliente, significa que nunca se registró correctamente o ya se borró.
        // Simplemente retornamos sin hacer nada (return), NO lanzamos error.
        if( !roomExists )
            return;

        const deleted = this.availableRooms.delete( roomPin );

    }

    // --------------------------------------------------------------------------
    // * Métodos de comprobación de existencia de registros
    // --------------------------------------------------------------------------

    roomHasHost( roomPin: string ): boolean {
        const room = this.getRoom( roomPin );

        if(!room)
            return false

        const hostClient = room["host"];

        return hostClient !== undefined;
    }

    roomExist( roomPin: string ): boolean {

        return this.availableRooms.has( roomPin );

    }


    roomHasClient( roomPin: string, clientId: string ): boolean {

        const room = this.getRoom( roomPin );

        if(!room)
            return false;

        const client = room[ clientId ];

        return client !== undefined;

    }


    getRoomHostSocketId( roomPin: string ): string | undefined {
        const room = this.getRoom( roomPin );

        if(!room)
            return undefined;

        if( this.roomHasHost( roomPin ) )
            return room["host"]?.socket.id;

        return undefined;
    }

    // --------------------------------------------------------------------------
    // ? Métodos Privados
    // --------------------------------------------------------------------------

    private getAvailableRooms() {

        const listOfRooms = [ ...this.availableRooms ]
                                .map( tuple => ({
                                    roomPin: tuple[0],
                                    conectadosAEstaSala: {
                                        ...tuple[1]
                                    }
                                }))

        return listOfRooms; 
    }

    private getRoom( roomPin: string ): ConnectedClients | undefined {
        const room = this.availableRooms.get( roomPin );

        if(!room)
            return undefined

        return room;
    }


    // --------------------------------------------------------------------------
    // * Métodos de loggeo
    // --------------------------------------------------------------------------

    logConnectedClients(): void {
        if (this.availableRooms.size === 0) {
            this.logger.log('🦕 No hay salas activas en este momento.');
            return;
        }

        this.availableRooms.forEach((clients, pin) => {
            const entries = Object.entries(clients);
            const hostData = clients['host'];
            // Filtramos los que no sean 'host' y existan para obtener la lista de jugadores
            const players = entries.filter(([id, data]) => id !== 'host' && data !== undefined);

            let output = `\n`;
            output += `================================================================\n`;
            output += `🏠 SESIÓN ACTIVA - PIN: ${pin}\n`;
            output += `================================================================\n`;

            // --- SECCIÓN DEL HOST ---
            if (hostData) {
            output += `👑 HOST DETAILS\n`;
            output += `   ID Usuario:  ${hostData.userId}\n`;
            output += `   Socket ID:   ${hostData.socketId}\n`;
            output += `   Status:      Conectado\n`;
            } else {
            output += `⚠️ HOST:        No detectado (Sala huérfana)\n`;
            }

            output += `----------------------------------------------------------------\n`;

            // --- SECCIÓN DE JUGADORES ---
            output += `👥 PLAYERS (${players.length})\n`;
            if (players.length > 0) {
            players.forEach(([socketId, data]) => {
                const nickname = data?.nickname || 'Anonymous';
                // Mostramos los primeros 8 caracteres del socketId para no saturar
                output += `   • [${socketId.substring(0, 8)}...] Nickname: ${nickname}\n`;
            });
            } else {
            output += `   (Aún no hay jugadores unidos)\n`;
            }

            output += `================================================================`;

            this.logger.log(output);
        });
    }


}
