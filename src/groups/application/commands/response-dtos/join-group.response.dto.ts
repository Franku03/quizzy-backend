/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\commands\response-dtos\join-group.response.dto.ts

export interface JoinGroupResponse {
    readonly groupId: string;
    readonly groupName: string;
    readonly joinedAt: Date;
    readonly role: string;
}