// src/database/infrastructure/mongo/mongo-error.mapper.ts
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';

export class MongoErrorMapper implements IErrorMapper<IDatabaseErrorContext> {
    
    /**
     * Mapea una excepción nativa de MongoDB o Mongoose a un objeto ErrorData universal.
     */
    public toErrorData(error: any, context: IDatabaseErrorContext): ErrorData {
        // La información del contexto ya viene tipada
        const baseDetails = context; 

        if (error.code === 11000) {
            return new ErrorData(
                "DUPLICATE_RESOURCE_CONSTRAINT",
                "Violation of unique index constraint.",
                ErrorLayer.INFRASTRUCTURE,
                { 
                    ...baseDetails, 
                    mongoCode: error.code, 
                    keyPattern: error.keyPattern, 
                    keyValue: error.keyValue 
                },
                error
            );
        }

        // 2. CONEXIÓN/RED
        if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
            return new ErrorData(
                "DB_CONNECTION_FAILED",
                "Could not connect to MongoDB Atlas.",
                ErrorLayer.INFRASTRUCTURE,
                baseDetails, 
                error 
            );
        }

        // 3. VALIDACIÓN DE ESQUEMA (Mongoose)
        if (error.name === 'ValidationError') {
            return new ErrorData(
                "DB_SCHEMA_VALIDATION",
                "Mongoose/Mongo schema validation failed.",
                ErrorLayer.INFRASTRUCTURE,
                { 
                    ...baseDetails, 
                    validationErrors: error.errors 
                }, 
                error 
            );
        }

        // 4. ERROR DESCONOCIDO (Default)
        return new ErrorData(
            "INFRA_UNKNOWN_ERROR",
            error?.message || 'Unknown infrastructure error.',
            ErrorLayer.INFRASTRUCTURE,
            baseDetails, 
            error 
        );
    }
}