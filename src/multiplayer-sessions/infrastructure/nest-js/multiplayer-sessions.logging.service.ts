import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SessionRoles } from './enums/session-roles.enum';
import { WsException } from '@nestjs/websockets';

interface ConnectedClients {

    [id: string]: {
        socket: Socket,
        nickname: string,
        roomPin: string
        role: SessionRoles,
    }; 
}

@Injectable()
export class MultiplayerSessionsService {

    private availableRooms: Map<string, ConnectedClients> = new Map<string, ConnectedClients>();

    registerRoom( client: Socket ){


        const roomPin = client.handshake.headers.pin as string;

        this.availableRooms.set( roomPin, {} );

    } 


    registerClient( client: Socket ){

        const nickname = client.handshake.headers.nickname as string;

        const roomPin = client.handshake.headers.pin as string;

        const role = client.handshake.headers.role as SessionRoles;

        const room = this.getRoom( roomPin );

        room[ client.id ] = {
            socket: client,
            roomPin: roomPin,
            role: role,
            nickname: nickname,
        };

    } 


    removeClient( roomPin: string, clientId: string){

        const room = this.availableRooms.get( roomPin );

        if(!room)
            this.roomDoesNotExist( roomPin );

        delete room[ clientId ];
    }

    private getConnectedClients() {

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

        const connectedClients = this.getConnectedClients();

        connectedClients.forEach( room => {
            console.log( room );
        });
    

    }

    // getUserFullNameBySocketId( socketId: string ){
    //     return this.connectedClients[ socketId ]
    // }

    private getRoom( roomPin: string ): ConnectedClients {
        const room = this.availableRooms.get( roomPin );

        if(!room)
            this.roomDoesNotExist( roomPin );

        return room;;
    }

    private  roomDoesNotExist( arg: any ): never {
        throw new WsException(`La sala con PIN ${arg} a unirse NO Existe`);
    }
}
