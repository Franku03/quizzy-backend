/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\ports\IPinRepository.ts

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