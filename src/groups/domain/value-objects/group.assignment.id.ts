/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\domain\value-objects\group.assignment.id.ts

import { UuidVO } from "src/core/domain/abstractions/vo.id";

export class GroupAssignmentId extends UuidVO {
    constructor(value: string) {
        super(value);
    }
}