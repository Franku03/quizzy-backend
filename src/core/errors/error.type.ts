// src/core/types/ErrorData.ts

import { ErrorLayer } from "./error.enum";

export class ErrorData extends Error {
    // Declaramos explícitamente stackTrace para evitar el error de tipado
    public readonly stackTrace?: string;
    
    public readonly errorId: string;
    public readonly code: string;
    public readonly message: string; // Heredada y seteada por super()
    public readonly layer: ErrorLayer;
    public readonly timestamp: Date;
    public readonly details?: Record<string, any>;
    public readonly innerError?: Error;

    constructor(
        code: string,
        message: string,
        layer: ErrorLayer,
        details?: Record<string, any>,
        innerError?: Error
    ) {
        // Llama al constructor base. Esto inicializa this.message y captura this.stack.
        super(message); 
        
        // Asignar el nombre del error.
        this.name = 'ErrorData'; 

        // Inicialización de propiedades:
        this.errorId = this.generateUniqueId();
        this.code = code;
        this.layer = layer;
        this.timestamp = new Date();
        this.details = details;
        this.innerError = innerError;
        
        // 1. Corregido: La propiedad debe ser 'stackTrace' (la que declaramos)
        // 2. Usamos el 'stack' nativo de JS/TS para obtener la pila de llamadas
        
        // Si hay un error interno y tiene una pila, la usamos.
        if (innerError && innerError.stack) {
            this.stackTrace = innerError.stack;
        } else {
            // Si no hay innerError, usamos la pila de llamadas capturada por 'super(message)' (this.stack).
            this.stackTrace = this.stack; 
        }
    }

    // Método dummy para generar un ID único (debe ser reemplazado por un UUID real).
    private generateUniqueId(): string {
        return Math.random().toString(36).substring(2, 9);
    }
}