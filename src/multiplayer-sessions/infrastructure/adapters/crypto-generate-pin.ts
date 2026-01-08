import * as crypto from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { IGeneratePinService } from "src/multiplayer-sessions/domain/domain-services";
import type { IPinRepository } from 'src/multiplayer-sessions/domain/ports';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { FileSystemPinRepository } from './file-system.pin.repository';
import { IInfrastructureErrorContext } from 'src/core/errors/interface/context/i-error-infraestructure-context.interface';
import { Either, ErrorData } from 'src/core/types';
import { CryptoGeneratePinServiceErrorMapper } from '../errors/crypto-generate-pin.error.mapper';
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';


@Injectable()
export class CryptoGeneratePinService implements IGeneratePinService {

    // Máximo de intentos para generar un PIN único
    private readonly MAX_ATTEMPTS = process.env.PIN_GENERATION_ATTEMPTS ? +process.env.PIN_GENERATION_ATTEMPTS : 50;

    private readonly errorMapper: IErrorMapper<unknown, IInfrastructureErrorContext> = new CryptoGeneratePinServiceErrorMapper()


    constructor(
        @Inject( FileSystemPinRepository )
        private readonly fileSystemRepo: IPinRepository,

        // @Inject( ERROR_TOKENS.MAPPERS.PIN )
    ){}

    public async generateUniquePin(): Promise<Either<ErrorData,string>> {

        // Obtenemos los pins activos (que ahora vienen instantáneamente de la RAM del repo)
        const activePins = await this.fileSystemRepo.getActivePins();

        let newPin: string;
        let attempts = 0;

        do {
            if (attempts >= this.MAX_ATTEMPTS ) {
                const error = new Error(`Fallo al generar número aleatorio después de ${this.MAX_ATTEMPTS} intentos.`);
                return Either.makeLeft( this.errorMapper.toErrorData( error ,this.getCtx() ) );
            }
            
            // Generates a new cryptographically secure PIN
            newPin = this.generateSecurePin();
            attempts++;
            
        // Check if the generated PIN is already in the Set (O(1) lookup time)
        } while (activePins.has(newPin));

        // After finding a unique PIN, save it to the file immediately
        // IMPORTANTE: Esto ahora también lo añade al Set de RAM del repo para que el siguiente proceso lo vea ocupado
        await this.fileSystemRepo.saveNewPin(newPin);

        // Return the unique PIN
        return Either.makeRight(newPin);
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


     private getCtx(): IInfrastructureErrorContext {
        return {
            adapterName: CryptoGeneratePinService.name,
            portName: 'IGeneratePinService',
            module: "multiplayer-sessions"
        }
    }

}