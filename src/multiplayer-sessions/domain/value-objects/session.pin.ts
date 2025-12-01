import { ValueObject } from "src/core/domain/abstractions/value.object";
import { IVerifyAvailablePinService } from "../domain-services/verify-available-pin.service.interface";
import { IGeneratePinService } from "../domain-services";

interface SessionPinProps {
    sessionPin: string
}


export class SessionPin extends ValueObject<SessionPinProps> {

    private constructor(
        sessionPin: string
    ){

        super({ sessionPin: sessionPin });

    }

    
    public static create( verificationService: IVerifyAvailablePinService, generationService: IGeneratePinService  ){
        
        let pin: string = this.generatePin( generationService );

        // Para asegurarnos de que devolvemos un Pin valido y disponible siempre

        while( true ){


            if( !SessionPin.isPinValid( pin ) )
                throw new Error('El pin debe ser exactamente de 6 dígitos');
 

            if( this.isPinAvailable( pin, verificationService ) )
                break;

            pin = this.generatePin( generationService );
                
        };

        return new SessionPin( pin );

    }


    // Para construccion del VO




    private static isPinAvailable( pin: string, verificationService: IVerifyAvailablePinService ): boolean {

        return verificationService.verifyPin( pin );

    }

    private static generatePin( generationService: IGeneratePinService ): string {

        return generationService.generatePin();

    }



    // * Vieja version para generar el pin directamente con Math.random()
    // private static generatePin(): string {
    //     // Genera un número entero aleatorio entre 0 (inclusivo) y 999999 (inclusivo).
    //     // Math.random() genera un número entre 0 (incluido) y 1 (excluido).
    //     // Math.floor(...) asegura que sea un número entero.
    //     const min = 0;
    //     const max = 999999;
    //     const pinNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    //     // Convierte el número a cadena de texto y le añade ceros a la izquierda
    //     // hasta que tenga una longitud de 6.
    //     // '000000' es la plantilla para asegurar los ceros iniciales.
    //     // slice(-6) toma los últimos 6 caracteres.
    //     const generatedPin = ( '000000' + pinNumber ).slice(-6);

    //     return generatedPin;
    // }

    // private static isPinAvailable( pin: string, verificationService: IVerifyAvailablePinService ): boolean {

    //     return verificationService.verifyPin( pin );

    // }


    // Para uso general
    
    public static isPinValid( pin: string ): boolean {

        // Regex pattern para un PIN de 6 dígitos
        // ^: Empieza la cadena
        // \d{6}: Exactamente 6 dígitos (0 a 9)
        // $: Termina la cadena
        const pinRegex = /^\d{6}$/;

        // Devuelve true si el pin coincide con la expresion
        return pinRegex.test( pin );

    }

    public getPin(): string {
        return this.properties.sessionPin;
    }


}