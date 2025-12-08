// src/core/errors/interfaces/i-error-mapper.interface.ts
import { ErrorData } from "../../error.type";

/**
 * Contrato que todos los mappers de error deben implementar
 * Aplicando DIP: Capas altas (servicios) dependen de esta abstracción
 */
export interface IErrorMapper<TContext> {
    /**
     * Convierte un error nativo a ErrorData canónico
     * @param error Error original (MongoDB, Cloudinary, etc.)
     * @param context Contexto específico de la operación
     */
    toErrorData(error: any, context: TContext): ErrorData;
}