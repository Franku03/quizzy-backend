/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\domain\ports\notification.repository.port.ts

import { INotification } from '../INotification';

export interface INotificationRepository {
    save(notification: INotification): Promise<void>;
    findById(id: string): Promise<INotification | null>;
    findByUserId(userId: string, limit: number, offset: number): Promise<INotification[]>;
    markAsRead(id: string): Promise<void>;
}