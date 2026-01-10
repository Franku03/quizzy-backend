/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\errors\mongo-error.mapper.ts

import { ErrorData, ErrorLayer } from 'src/core/types';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { MongoError, MongoServerError } from 'mongodb'; 
import { Error as MongooseError } from 'mongoose'; 

interface MongoDuplicateKeyError extends MongoServerError {
    code: 11000;
    keyPattern: Record<string, number>;
    keyValue: Record<string, any>;
}

export class MongoErrorMapper implements IErrorMapper<unknown, IDatabaseErrorContext> {
    
    public toErrorData(error: unknown, context: IDatabaseErrorContext): ErrorData {
        const baseDetails = context; 

        // 1. DUPLICADOS
        if (error instanceof MongoError && error.code === 11000) {
            const duplicateError = error as MongoDuplicateKeyError;
            return new ErrorData(
                "DUPLICATE_RESOURCE_CONSTRAINT",
                "Violation of unique index constraint.",
                ErrorLayer.INFRASTRUCTURE,
                { ...baseDetails, mongoCode: 11000, keyPattern: duplicateError.keyPattern, keyValue: duplicateError.keyValue },
                error
            );
        }

        // 2. VALIDACIÓN DE ESQUEMA
        if (error instanceof MongooseError.ValidationError) {
            return new ErrorData(
                "DB_SCHEMA_VALIDATION",
                "Mongoose/Mongo schema validation failed.",
                ErrorLayer.INFRASTRUCTURE,
                { ...baseDetails, validationErrors: error.errors }, 
                error 
            );
        }

        // 3. ERROR DESCONOCIDO
        const message = error instanceof Error ? error.message : 'Unknown infrastructure error.';
        const safeError = error instanceof Error ? error : undefined;
        
        return new ErrorData(
            "INFRA_UNKNOWN_ERROR",
            message,
            ErrorLayer.INFRASTRUCTURE,
            baseDetails, 
            safeError 
        );
    }
}