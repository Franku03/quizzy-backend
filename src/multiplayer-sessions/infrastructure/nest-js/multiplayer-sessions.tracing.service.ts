import { Injectable } from '@nestjs/common';
import { SessionRoles } from './enums/session-roles.enum';
import { SessionSocket } from './interfaces/socket-definitions.interface';

interface ConnectedClients {

    [id: string]: {
        socket: SessionSocket,
        nickname?: string,
        roomPin: string
        role: SessionRoles,
    }; 
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

        room[ client.id ] = {
            socket: client,
            roomPin: roomPin,
            role: role,
        };

    } 

    registerClientNickname( client: SessionSocket ){

        const room = this.getRoom( client.data.roomPin );

        const clientInRoom = room[ client.id ];
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


    removeRoom( roomPin: string ){

        const roomExists = this.availableRooms.has( roomPin );

        // IMPORTANTE: Si no encontramos sala para este cliente, significa que nunca se registró correctamente o ya se borró.
        // Simplemente retornamos sin hacer nada (return), NO lanzamos error.
        if(! roomExists )
            return;

        this.availableRooms.delete( roomPin );

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

    logConnectedClients(): void {

        const availableRooms = this.getAvailableRooms();

        availableRooms.forEach( room => {
            console.log( room );
        });
    

    }

    // getUserFullNameBySocketId( socketId: string ){
    //     return this.connectedClients[ socketId ]
    // }

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
