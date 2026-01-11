import { ErrorData } from 'src/core/types';
import { Either } from '../../../core/types/either';


// Exclusivamente para manejar operaciones sobre el lugar donde se persista el PIN, en nuestro caso sera en el file system
export interface IPinRepository {

    // ========== LEGACY (NO TOCAR - Compatibilidad) ==========

    getActivePins(): Promise<Set<string>>;
    saveNewPin(pin: string): Promise<void>;
    releasePin(pinToRemove: string): Promise<void>;


    // ========== VERSION CON EITHER (ROP - Nueva Arquitectura) ==========

    getActivePinsEither(): Promise< Either< ErrorData, Set<string> > >;
    saveNewPinEither(pin: string): Promise< Either< ErrorData, void >>;
    releasePinEither(pinToRemove: string): Promise< Either< ErrorData, void> >; 

}