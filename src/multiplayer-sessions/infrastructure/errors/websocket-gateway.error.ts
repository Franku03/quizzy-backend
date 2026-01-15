import { ServerErrorEvents } from "../nest-js/enums/websocket.events.enum";
import { ISocketErrorPayload } from "../nest-js/interfaces/socket-definitions.interface";

export const createSocketErrorPayload = ( error: unknown, errorType: ServerErrorEvents ): ISocketErrorPayload => {

    const message = error instanceof Error ? error.message : 'Unknown infrastructure error.';

    switch( errorType ){

        case( ServerErrorEvents.CONNECTION_ERROR ):

            return {
                statusCode: 400,
                message: message,
                error: "WS Bad Request",
            }
            
        case( ServerErrorEvents.SYNC_ERROR ):

            return{
                statusCode: 500,
                message: message,
                error: "WS Sync Internal Server Error",
            }
            
        default:
            
            return {
                statusCode: 500,
                message: message,
                error: "WS Internal Server Error",
            }
            
            
    }




}