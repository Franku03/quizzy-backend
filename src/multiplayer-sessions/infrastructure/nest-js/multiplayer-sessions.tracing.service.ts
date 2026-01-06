import { Injectable } from '@nestjs/common';
import { SessionRoles } from './enums/session-roles.enum';
import { SessionSocket } from './interfaces/socket-definitions.interface';

interface ConnectedClients {

    [id: string]: {

        socket: SessionSocket,
        nickname?: string,
        userId?: string,
        roomPin: string
        role: SessionRoles, 

    } | undefined

}

@Injectable()
export class MultiplayerSessionsTracingService {

    private availableRooms: Map<string, ConnectedClients> = new Map<string, ConnectedClients>();

    registerRoom( client: SessionSocket ){

        const roomPin = client.handshake.headers.pin as string;

        this.availableRooms.set( roomPin, {} );

    }

    registerClient( client: SessionSocket ){


        const roomPin = client.data.roomPin;

        const role = client.data.role

        const room = this.getRoom( roomPin );

        if( role === SessionRoles.HOST ){

            room["host"] = {
                socket: client,
                roomPin: roomPin,
                role: role,  
                userId: client.data.userId  
            }

        } else {

            room[ client.id as string ] = {
                socket: client,
                roomPin: roomPin,
                role: role,  
            };


        }

    } 

    registerClientNickname( client: SessionSocket ){

        const room = this.getRoom( client.data.roomPin );

        const clientInRoom = room[ client.id ];

        if( clientInRoom )
            clientInRoom.nickname = client.data.nickname;

    }


    removeClient( roomPin: string, clientId: string){

        const room = this.getRoom( roomPin );

        // IMPORTANTE: Si no encontramos sala para este cliente, 
        // significa que nunca se registró correctamente o ya se borró.
        // Simplemente retornamos sin hacer nada (return), NO lanzamos error.
        if(!room)
            return;

        delete room[ clientId ];
    }


    removeHost( roomPin: string, clientId: string) {

        const room = this.getRoom( roomPin );

        if(!room)
            return;

        delete room["host"];
    }



    removeRoom( roomPin: string ){

        const roomExists = this.availableRooms.has( roomPin );

        // IMPORTANTE: Si no encontramos sala para este cliente, significa que nunca se registró correctamente o ya se borró.
        // Simplemente retornamos sin hacer nada (return), NO lanzamos error.
        if(! roomExists )
            return;

        this.availableRooms.delete( roomPin );

    }

    roomHasHost( roomPin: string ): boolean {
        const room = this.getRoom( roomPin );

        const hostClient = room["host"];

        return hostClient !== undefined;
    }

    getRoomHostSocketId( roomPin: string ): string | undefined {
        const room = this.getRoom( roomPin );

        if( this.roomHasHost( roomPin ) )
            return room["host"]?.socket.id;

        return undefined;
    }


    logConnectedClients(): void {

        const availableRooms = this.getAvailableRooms();

        availableRooms.forEach( room => {
            console.log( room );
        });
    

    }

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

    private getRoom( roomPin: string ): ConnectedClients  {
        const room = this.availableRooms.get( roomPin );

        if(!room)
            return this.roomDoesNotExist( roomPin );

        return room;
    }



    private roomDoesNotExist( arg: any ): never {
        throw new Error(`La sala con PIN ${arg} a unirse NO Existe`);
    }
}
