import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

interface ConnectedClients {
    // ? Index Signature, basicamente estamos definiendo la 
    // estructura de un array o un diccionario (Objeto de JS) a traves 
    // de los tipos de sus posibles valores, en este caso cualquiera de los casos es posible
    [id: string]: {
        socket: Socket,
    }; // el id de tipo string del socket apunta a un objeto que contiene el socket y el usuario
}

@Injectable()
export class MultiplayerSessionsService {

    private connectedClients: ConnectedClients = {}

    registerClient( client: Socket){

        this.connectedClients[ client.id ] = {
            socket: client,
        };

    } 


    removeClient( clientId: string){
        delete this.connectedClients[ clientId ];
    }

    getConnectedClients(): string[] {
        return Object.keys( this.connectedClients ); // Creo que Keys nos devuelve un array con todas las llaves del objeto, y por hacemos length
    }

    getUserFullNameBySocketId( socketId: string ){
        return this.connectedClients[ socketId ]
    }
}
