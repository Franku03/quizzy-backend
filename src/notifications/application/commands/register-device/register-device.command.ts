/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\application\commands\register-device\register-device.command.ts

export class RegisterDeviceCommand {
    constructor(
        public readonly userId: string,
        public readonly token: string,
        public readonly deviceType: string,
    ) {}
}
