/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\domain\ports\device.repository.port.ts

export interface IDeviceRepository {
    register(userId: string, token: string, deviceType: string): Promise<void>;
    remove(userId: string, token: string): Promise<void>;
    findTokensByUserId(userId: string): Promise<string[]>;
}