/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\domain-services\generate-pin.service.interface.ts

import { Either, ErrorData } from "src/core/types";

// Este servicio como contrato debe implementarse en infraestructura para generar el ID mediante la libreria crypto de Node.js
export interface IGeneratePinService {

    generateUniquePin(): Promise<Either<ErrorData,string>>;
    
}