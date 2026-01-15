/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\domain\domain-services\i.uuid-generator.interface.ts

import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";

export interface IUuidGenerationService {
    generateIUserId(): string;
}