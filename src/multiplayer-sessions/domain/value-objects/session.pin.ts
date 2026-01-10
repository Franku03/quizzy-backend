import { ValueObject } from "src/core/domain/abstractions/value.object";

interface SessionPinProps {
    sessionPin: string
}


export class SessionPin extends ValueObject<SessionPinProps> {

    public constructor(
        sessionPin: string
    ){

        super({ sessionPin: sessionPin });

    }

    
    public static create( pin: string ){
        
        if( !SessionPin.isPinValid( pin ) )
            throw new Error('El pin debe tener de 6 a 10 dígitos');
                

        return new SessionPin( pin );

    }


    // Para uso general
    
    public static isPinValid( pin: string ): boolean {

        // Regex pattern para un PIN de 6 dígitos
        // ^: Empieza la cadena
        // \d{6,10}: Exactamente de 6 a 10 dígitos (0 a 9)
        // $: Termina la cadena
        const pinRegex = /^\d{6,10}$/;

        // Devuelve true si el pin coincide con la expresion
        return pinRegex.test( pin );

    }

    public getPin(): string {
        return this.properties.sessionPin;
    }


}