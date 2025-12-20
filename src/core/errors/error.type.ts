// src/core/types/ErrorData.ts

import { ErrorLayer } from "./error.enum";

export class ErrorData extends Error {
    // Declaramos explícitamente stackTrace para evitar el error de tipado
    public readonly stackTrace?: string;

    public readonly errorId: string;
    public readonly code: string;
    //public readonly message: string; // Heredada y seteada por super()
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

    public toLogString(): string {
        const SEPARATOR_RED_DARK = '\x1b[31m==================================================\x1b[0m';
        const CYAN = '\x1b[36m';
        const RED = '\x1b[91m';
        const BOLD = '\x1b[1m';
        const YELLOW = '\x1b[33m';
        const MAGENTA = '\x1b[35m';
        const BLUE = '\x1b[34m';
        const GREEN_BRIGHT = '\x1b[92m';
        const RESET = '\x1b[0m';

        const lines: string[] = [];

        let headerColor = BLUE;
        let headerLabel = 'FALLO DE SISTEMA';

        switch (this.layer) {
            case 'DOMAIN':
                headerColor = YELLOW;
                headerLabel = 'ERROR DE DOMINIO';
                break;
            case 'APPLICATION':
                headerColor = MAGENTA;
                headerLabel = 'FALLO DE APLICACIÓN';
                break;
            case 'INFRASTRUCTURE':
            case 'PRESENTATION':
            case 'EXTERNAL':
            default:
                headerLabel = `ERROR DE ${this.layer}`;
                break;
        }

        const headerLine = (
            `${headerColor}${BOLD}[🚨 ${headerLabel}]` +
            ` - ID Error: ` +
            `${GREEN_BRIGHT}${BOLD}${this.errorId}${RESET}`
        );

        lines.push(`\n${SEPARATOR_RED_DARK}`);
        lines.push(headerLine);
        lines.push(SEPARATOR_RED_DARK);

        lines.push(`${CYAN}Layer:       ${headerColor}${this.layer}${RESET}`);
        lines.push(`${CYAN}Code:        ${RED}${this.code}${RESET}`);
        lines.push(`${CYAN}Timestamp:   ${this.timestamp.toISOString()}${RESET}`);
        lines.push(`${CYAN}Message:     ${this.message}${RESET}`);

        if (this.details && Object.keys(this.details).length > 0) {
            lines.push(`\n${SEPARATOR_RED_DARK}`);
            lines.push(`${CYAN}${BOLD}--------------- CONTEXT DETAILS ----------------${RESET}`);
            lines.push(SEPARATOR_RED_DARK);
            lines.push(`${CYAN}${JSON.stringify(this.details, null, 2)}${RESET}`);
        }

        if (this.innerError) {
            lines.push(`\n${SEPARATOR_RED_DARK}`);
            lines.push(`${CYAN}${BOLD}--------------- ERROR INTERNO ----------------${RESET}`);
            lines.push(SEPARATOR_RED_DARK);
            lines.push(`${CYAN}Name:        ${this.innerError.name}`);
            lines.push(`${CYAN}Message:     ${this.innerError.message}${RESET}`);
        }

        if (this.stackTrace) {
            lines.push(`\n${SEPARATOR_RED_DARK}`);
            lines.push(`${CYAN}${BOLD}--------------- STACK TRACE ----------------${RESET}`);
            lines.push(SEPARATOR_RED_DARK);
            lines.push(this.stackTrace.trim());
        }

        lines.push(`\n${SEPARATOR_RED_DARK}\n`);
        return lines.join('\n');
    }
}