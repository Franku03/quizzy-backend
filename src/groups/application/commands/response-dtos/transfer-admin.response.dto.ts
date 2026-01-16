/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\commands\response-dtos\transfer-admin.response.dto.ts

export interface TransferAdminResponse {
    readonly groupId: string;
    readonly previousAdmin: {
        readonly userId: string,
        readonly role: string
    },
    readonly newAdmin: {
        readonly userId: string,
        readonly role: string
    },
    readonly transferredAt: Date;
}