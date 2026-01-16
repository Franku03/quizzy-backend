/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\application\commands\mark-notification-as-read\mark-notification-as-read.command.ts

export class MarkNotificationAsReadCommand {
    constructor(
        public readonly notificationId: string,
        public readonly userId: string,
    ) {}
}
