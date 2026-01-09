/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\infrastructure\adapters\cloudinary\errors\cloudinary.error.mapper.ts

import { ErrorData, ErrorLayer } from 'src/core/types';
import { IExternalServiceErrorContext } from 'src/core/errors/interface/context/i-external-service.context';
import { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';

export class CloudinaryErrorMapper implements IErrorMapper<unknown, IExternalServiceErrorContext> {
    
    public toErrorData(error: unknown, context: IExternalServiceErrorContext): ErrorData {
        const err = error as any;
        const httpCode = err?.http_code || err?.status || 500;
        const safeError = error instanceof Error ? error : undefined;
        
        const baseDetails = {
            ...context,
            httpCode,
            cloudinaryCode: err?.error?.code,
            provider: 'cloudinary',
            isExternal: true,
            originalErrorMessage: err?.message
        };

        // 1. VALIDACIÓN/DUPLICADO
        if (httpCode === 400) {
            const message = this.buildValidationMessage(err, context);
            const code = err?.message?.includes('already exists') ? 'DUPLICATE_ASSET' : 'EXTERNAL_VALIDATION_FAILED';
            
            return new ErrorData(code, message, ErrorLayer.EXTERNAL, baseDetails, safeError);
        }

        // 2. LÍMITE/RECURSO AGOTADO
        if (httpCode === 429 || httpCode === 413) {
            const message = httpCode === 429 ? 'Rate limit exceeded in Cloudinary.' : 'File too large (413).';
            return new ErrorData("EXTERNAL_RESOURCE_EXHAUSTED", message, ErrorLayer.EXTERNAL, baseDetails, safeError);
        }
        
        // 3. NO AUTORIZADO/PROHIBIDO
        if (httpCode === 401 || httpCode === 403) {
            return new ErrorData("EXTERNAL_AUTH_FAILED", "Invalid credentials or insufficient permissions.", ErrorLayer.EXTERNAL, baseDetails, safeError);
        }

        // 4. NO ENCONTRADO
        if (httpCode === 404 && (context.operation === 'delete' || context.operation === 'generate-url')) {
            return new ErrorData("RESOURCE_NOT_FOUND_EXTERNAL", `Resource not found: ${context.resourceId || 'unknown'}.`, ErrorLayer.EXTERNAL, baseDetails, safeError);
        }

        // 6. FALLBACK
        const finalMessage = err?.message || 'Unknown storage provider error.';
        return new ErrorData("EXTERNAL_UNKNOWN_ERROR", finalMessage, ErrorLayer.EXTERNAL, baseDetails, safeError);
    }
    
    private buildValidationMessage(error: any, context: IExternalServiceErrorContext): string {
        const message = error.message || 'Invalid request to Cloudinary';
        if (message.includes('already exists')) return `File already exists: ${context.resourceId || 'unknown'}`;
        if (message.includes('Invalid image file')) return 'Invalid file format.';
        if (message.includes('File size too large')) return 'File exceeds maximum size.';
        return message;
    }
}