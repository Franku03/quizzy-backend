export interface IErrorResponse {
    status: number;                     // Código HTTP
    code: string;                       // Código canónico interno
    message: string;                    // Mensaje amigable
    details?: Record<string, any>;      // Información adicional
    errorId: string;                    // ID único para trazabilidad
    timestamp?: string;                 // Opcional: cuando ocurrió
}