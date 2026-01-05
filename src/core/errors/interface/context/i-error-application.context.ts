// src/core/errors/interface/context/i-error-application-context.interface.ts
import { IErrorContext } from "./i-error-context.interface";

export interface IApplicationErrorContext extends IErrorContext {
    // operation (UseCase) viene de IErrorContext
    resourceTargetId?: string;  // El ID del recurso: 'kahoot_123'
    resourceType?: string;      // El tipo de recurso: 'Kahoot', 'Slide', 'User'
}