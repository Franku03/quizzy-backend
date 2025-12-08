import { ErrorData } from "../../error.type";
import { IErrorResponse } from "../i-error-response.interface";

/**
 * Contrato para servicios que mapean ErrorData a respuestas HTTP
 * Aplicando DIP: El filtro global depende de esta abstracción
 */
export interface IErrorService {
    /**
     * Convierte un ErrorData interno a una respuesta para el cliente
     */
    toClientResponse(errorData: ErrorData): IErrorResponse;
}