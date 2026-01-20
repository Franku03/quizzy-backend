/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\commands\response-dtos\assign-kahoot.response.dto.ts

export interface AssignKahootToGroupResponse {
    readonly groupId: string;
    readonly quizId: string;
    readonly assignedBy: string;
    readonly availableFrom: Date;
    readonly availableTo: Date;
}