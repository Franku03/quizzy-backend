/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\infrastructure\errors\in-memory-session-respository.error.mapper.ts

import { IInfrastructureErrorContext } from 'src/core/errors/interface/context/i-error-infraestructure-context.interface';
import { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { ErrorData, ErrorLayer } from 'src/core/types';

export interface InMemoryActiveSessionRepositoryErrorContext extends IInfrastructureErrorContext {

    operation: string,
    sessionPin?: string,
    token?: string,

}

export const REPOSITORY_ERRORS = {
    SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
    SAVE_FAILED: 'SAVE_FAILED',
    DELETE_FAILED: 'DELETE_FAILED'
};

export class InMemoryActiveSessionRepositoryErrorMapper implements IErrorMapper<unknown, InMemoryActiveSessionRepositoryErrorContext> {

    public toErrorData(error: unknown, context: IInfrastructureErrorContext): ErrorData {

        const baseDetails = context; 

        const message = error instanceof Error ? error.message : 'Unknown infrastructure error.';
        const safeError = error instanceof Error ? error : undefined;
        
        return new ErrorData(
            "MEMORY_ERROR",
            message,
            ErrorLayer.INFRASTRUCTURE,
            baseDetails, 
            safeError 
        );

    }




}