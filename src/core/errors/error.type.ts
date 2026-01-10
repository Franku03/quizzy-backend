/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\error.type.ts

import { randomUUID } from "crypto";
import { ErrorLayer } from "./error.enum";
import { IErrorContext } from "./interface/context/i-error-context.interface";

export class ErrorData extends Error {
    public readonly stackTrace?: string;
    public readonly errorId: string;
    public readonly code: string;
    public readonly layer: ErrorLayer;
    public readonly timestamp: Date;
    public readonly details?: IErrorContext;
    public readonly innerError?: Error;

    constructor(
        code: string,
        message: string,
        layer: ErrorLayer,
        details?: IErrorContext,
        innerError?: Error
    ) {
        super(message);
        this.name = 'ErrorData';
        this.errorId = randomUUID();
        this.code = code;
        this.layer = layer;
        this.timestamp = new Date();
        this.details = details;
        this.innerError = innerError;

        if (innerError && innerError.stack) {
            this.stackTrace = innerError.stack;
        } else {
            this.stackTrace = this.stack;
        }
    }


public setContext(newDetails: Record<string, any>): this {
    const currentDetails = this.details || {};
    const mergedDetails = { ...currentDetails };

    // Definimos el peso de las capas para comparar jerarquía
    const layerPriority: Record<string, number> = {
        'DOMAIN': 1,
        'APPLICATION': 2,
        'INFRASTRUCTURE': 3
    };

    for (const key in newDetails) {
        const newValue = newDetails[key];
        if (newValue === undefined || newValue === null) continue;

        if (key === 'operation') {
            // REGLA DE ORO:
            // Solo permitimos que el Filter (INFRA) o el Decorador (APP) 
            // cambien la operación si la capa del error es INFERIOR.
            // Una vez que el error llega a APPLICATION, la operación se vuelve SAGRADA.
            
            const isAtApplicationOrHigher = layerPriority[this.layer] >= layerPriority['APPLICATION'];
            const alreadyHasOperation = !!mergedDetails[key];

            if (isAtApplicationOrHigher && alreadyHasOperation) {
                // Si el error ya está en nivel APP y ya tiene nombre, 
                // NO dejamos que nadie (ni el Filter) lo cambie.
                continue;
            }
            
            mergedDetails[key] = newValue;
            continue;
        }

        // Protección de campos de identidad del dominio
        const protectedFields = ['domainObjectType', 'domainObjectKind', 'domainObjectId'];
        if (protectedFields.includes(key) && mergedDetails[key]) continue;

        mergedDetails[key] = newValue;
    }

    // Prefijo de mensaje (Kahoot -> ...)
    if (newDetails.rootAggregateName && !this.message.startsWith(newDetails.rootAggregateName)) {
        // @ts-ignore
        this.message = `${newDetails.rootAggregateName} -> ${this.message}`;
    }

    (this.details as any) = mergedDetails;
    return this;
}
    public toLogString(): string {
        const SEPARATOR_RED_DARK = '\x1b[31m======================================================================\x1b[0m';
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

        lines.push(`${CYAN}Layer:        ${headerColor}${this.layer}${RESET}`);
        lines.push(`${CYAN}Code:         ${RED}${this.code}${RESET}`);
        lines.push(`${CYAN}Timestamp:    ${this.timestamp.toISOString()}${RESET}`);
        lines.push(`${CYAN}Message:      ${this.message}${RESET}`);

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
            lines.push(`${CYAN}Name:         ${this.innerError.name}`);
            lines.push(`${CYAN}Message:      ${this.innerError.message}${RESET}`);
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