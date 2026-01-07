import * as crypto from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { IGeneratePinService } from "src/multiplayer-sessions/domain/domain-services";
import type { IPinRepository } from 'src/multiplayer-sessions/domain/ports';
import { FileSystemPinRepository } from './file-system.pin.repository';


@Injectable()
export class CryptoGeneratePinService implements IGeneratePinService {

    // Máximo de intentos para generar un PIN único
    private readonly MAX_ATTEMPTS = process.env.PIN_GENERATION_ATTEMPTS ? +process.env.PIN_GENERATION_ATTEMPTS : 50;

    constructor(
        @Inject( FileSystemPinRepository )
        private readonly fileSystemRepo: IPinRepository
    ){}

    public async generateUniquePin(): Promise<string> {

        const activePins = await this.fileSystemRepo.getActivePins();

        let newPin: string;
        let attempts = 0;

        do {
            if (attempts >= this.MAX_ATTEMPTS ) {
                throw new Error(`Fallo al generar número aleatorio después de ${this.MAX_ATTEMPTS} intentos.`);
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

        const minLength = 6;
        const maxLength = 10;
        
        // 1. Elegimos la longitud aleatoriamente
        const pinLength = crypto.randomInt(minLength, maxLength + 1);

        // 2. Calculamos los límites numéricos para esa longitud
        // Ejemplo para 6 dígitos: min = 100,000; max = 999,999
        const minRange = Math.pow(10, pinLength - 1);
        const maxRange = Math.pow(10, pinLength);

        // 3. Generamos el número aleatorio directamente en el rango
        // randomInt(min, max) -> min es inclusivo, max es exclusivo.
        const pinNumber = crypto.randomInt(minRange, maxRange);

        return pinNumber.toString();
    }

}