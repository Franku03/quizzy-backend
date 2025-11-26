import { ValueObject } from "src/core/domain/abstractions/value.object";
import { IVerifyAvailablePinService } from "../domain-services/verify-available-pin.service.interface";

interface GamePinProps {
    sessionPin: string
}

export class SessionGamePin extends ValueObject<GamePinProps> {

    constructor(
        sessionPin: string
    ){

        super({ sessionPin: sessionPin });

    }

    public getPin(): string {
        return this.properties.sessionPin;
    }


    public static generatePin(): string {
        // Genera un número entero aleatorio entre 0 (inclusivo) y 999999 (inclusivo).
        // Math.random() genera un número entre 0 (incluido) y 1 (excluido).
        // Math.floor(...) asegura que sea un número entero.
        const min = 0;
        const max = 999999;
        const pinNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        // Convierte el número a cadena de texto y le añade ceros a la izquierda
        // hasta que tenga una longitud de 6.
        // '000000' es la plantilla para asegurar los ceros iniciales.
        // slice(-6) toma los últimos 6 caracteres.
        const generatedPin = ( '000000' + pinNumber ).slice(-6);

        return generatedPin;
    }

    public static isPinAvailable( pin: string, verificationService: IVerifyAvailablePinService ): boolean {

        return verificationService.verifyPin( pin );

    }

}