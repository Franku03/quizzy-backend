/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\infrastructure\nest-js\dtos\notification.dto.ts

export class NotificationDto {
    public readonly id: string;
    public readonly type: string;
    public readonly message: string;
    public readonly isRead: boolean;
    public readonly createdAt: string;
    public readonly resourceId?: string;
}
