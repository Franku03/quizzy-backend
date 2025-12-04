import * as crypto from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { IGeneratePinService } from "src/multiplayer-sessions/domain/domain-services";
import type { IPinRepository } from 'src/multiplayer-sessions/domain/ports';
import { FileSystemPinRepository } from './file-system.pin.repository';

const MAX_ATTEMPTS = 20; // Máximo de intentos para generar un PIN único

@Injectable()
export class CryptoGeneratePinService implements IGeneratePinService {

    constructor(
        @Inject( FileSystemPinRepository )
        private readonly fileSystemRepo: IPinRepository
    ){}

    public async generateUniquePin(): Promise<string> {

        const activePins = await this.fileSystemRepo.getActivePins();

        let newPin: string;
        let attempts = 0;

        do {
            if (attempts >= MAX_ATTEMPTS) {
                throw new Error(`Failed to generate a unique PIN after ${MAX_ATTEMPTS} attempts.`);
            }
            
            // Generates a new cryptographically secure PIN
            newPin = this.generateSecurePin();
            attempts++;
            
        // Check if the generated PIN is already in the Set (O(1) lookup time)
        } while (activePins.has(newPin));

        // After finding a unique PIN, save it to the file immediately
        await this.fileSystemRepo.saveNewPin(newPin);

        // Return the unique PIN
        return newPin;
    }


    public generateSecurePin(): string {

        // 1) Generamos un numero aleatorio entre 6 y 10 para obtener la longitud del PIN
        //  Esta fórmula toma el resultado de Math.random() (un número entre 0 y 1), 
        //  lo multiplica por la cantidad de números posibles en el rango (\(10-6+1=5\)), 
        //  lo redondea hacia abajo con Math.floor(), y luego le suma el valor mínimo (6) para obtener un resultado final entre 6 y 10. 
        const minLength = 6;
        const maxLength = 10;
        const pinLength = Math.floor(Math.random() * (maxLength  - minLength + 1)) + minLength;

        // 2) Validación de Longitud: Aseguramos que la longitud esté en el rango esperado.
        if (pinLength < minLength || pinLength > maxLength) {
            throw new Error("La longitud del PIN debe estar entre 6 y 10 dígitos.");
        }

        // 3) Cálculo del Máximo: El número máximo es 10^longitud - 1 (ej: 999999 para 6).
        //    NOTA: Usaremos BigInt para evitar problemas de precisión si la longitud fuera mayor a 16.
        const max = BigInt(10) ** BigInt(pinLength) - BigInt(1);

        // 4) Cálculo del Mínimo: El número mínimo es 10^(longitud - 1) (ej: 100000 para 6).
        const min = BigInt(10) ** BigInt(pinLength - 1);

        // 5) Cálculo del Rango: (maximo - minimo + 1)
        const range = max - min + BigInt(1);

        let pinNumericBigInt: bigint;
        let tries = 0;
        const maxTries = 10;

        // 5) Generación Criptográfica y Descarte:
        //    El uso de crypto.randomBytes asegura una verdadera aleatoriedad.
        //    Necesitamos generar un número en el rango [minimo, maximo].
        //    Usaremos un bucle para asegurar que el número generado esté dentro del rango,
        //    evitando el "bias" (sesgo) que ocurre al usar el operador módulo (%) directamente.
        do {
            if (tries++ >= maxTries) {
                throw new Error("Fallo al generar número aleatorio seguro después de varios intentos.");
            }
            
            // Calcula la cantidad de bytes necesarios para representar el rango completo.
            // Math.ceil(rango.toString(2).length / 8) bytes
            const bytesNeeded = Math.ceil(range.toString(2).length / 8);

            // Genera un buffer de bytes aleatorios.
            const buffer = crypto.randomBytes(bytesNeeded);

            // Convierte el buffer a BigInt (número entero grande sin signo).
            const randomNumber = BigInt('0x' + buffer.toString('hex'));

            // Si el número aleatorio está dentro del rango seguro [0, rango - 1]
            if (randomNumber < range) {
                // Mapeamos el número al rango deseado [minimo, maximo]
                pinNumericBigInt = randomNumber + min;
                break;
            }
        } while (true);


        // 6) Conversión Final a String y Retorno:
        // Como aseguramos que el número está en el rango [minimo, maximo],
        // ya tiene la longitud correcta y no necesita relleno con ceros.
        return pinNumericBigInt.toString();
    }

}