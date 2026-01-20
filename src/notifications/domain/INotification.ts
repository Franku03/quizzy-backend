/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\domain\INotification.ts

export interface INotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    resourceId?: string;
    isRead: boolean;
    createdAt: Date;
}