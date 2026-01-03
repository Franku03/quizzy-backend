// src/media/infrastructure/cloudinary/cloudinary-error.mapper.ts
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IExternalServiceErrorContext } from 'src/core/errors/interface/context/i-extenral-service.context';
import { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';

export class CloudinaryErrorMapper implements IErrorMapper<IExternalServiceErrorContext> {
    
    public toErrorData(error: any, context: IExternalServiceErrorContext): ErrorData {
        const httpCode = error.http_code || error.status || 500;
        
        const baseDetails = {
            ...context,
            httpCode,
            cloudinaryCode: error.error?.code,
            provider: 'cloudinary',
            isExternal: true,
            originalErrorMessage: error.message
        };

        // 1. VALIDACIÓN/DUPLICADO (400)
        if (httpCode === 400) {
            const message = this.buildValidationMessage(error, context);
            const code = error.message?.includes('already exists') ? 'DUPLICATE_ASSET' : 'EXTERNAL_VALIDATION_FAILED';
            
            return new ErrorData(
                code,
                message,
                ErrorLayer.EXTERNAL, 
                baseDetails,
                error
            );
        }

        // 2. LÍMITE/RECURSO AGOTADO (429, 413)
        if (httpCode === 429 || httpCode === 413) {
            return new ErrorData(
                "EXTERNAL_RESOURCE_EXHAUSTED",
                httpCode === 429 ? 'Rate limit exceeded in Cloudinary.' : 'File too large (413).',
                ErrorLayer.EXTERNAL,
                baseDetails,
                error
            );
        }
        
        // 3. NO AUTORIZADO/PROHIBIDO (401, 403)
        if (httpCode === 401 || httpCode === 403) {
            return new ErrorData(
                "EXTERNAL_AUTH_FAILED",
                "Invalid credentials or insufficient permissions in Cloudinary.",
                ErrorLayer.EXTERNAL,
                baseDetails,
                error
            );
        }

        // 4. NO ENCONTRADO (404) - Solo para delete o generate-url
        if (httpCode === 404 && 
            (context.operation === 'delete' || context.operation === 'generate-url')) {
            return new ErrorData(
                "RESOURCE_NOT_FOUND_EXTERNAL",
                `Resource not found in Cloudinary: ${context.resourceId || 'unknown'}.`,
                ErrorLayer.EXTERNAL,
                baseDetails,
                error
            );
        }

        // 5. ERRORES DE CONEXIÓN
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
             return new ErrorData(
                "EXTERNAL_CONNECTION_FAILED",
                `Connection/network failure with Cloudinary: ${error.message}.`,
                ErrorLayer.EXTERNAL,
                baseDetails,
                error
            );
        }

        // 6. FALLBACK
        return new ErrorData(
            "EXTERNAL_UNKNOWN_ERROR",
            error.message || 'Unknown storage provider error.',
            ErrorLayer.EXTERNAL,
            baseDetails,
            error
        );
    }
    
    // Helper actualizado para usar contexto genérico
    private buildValidationMessage(error: any, context: IExternalServiceErrorContext): string {
        const message = error.message || 'Invalid request to Cloudinary';
        
        if (message.includes('already exists')) {
            return `File already exists in Cloudinary: ${context.resourceId || 'unknown'}`;
        }
        
        if (message.includes('Invalid image file')) {
            return 'Invalid file format.';
        }
        
        if (message.includes('File size too large')) {
            return 'File exceeds maximum size.';
        }
        
        return message;
    }
}