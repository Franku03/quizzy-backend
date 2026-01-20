/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\get-pin-with-qr-token\get-pin-with-qr-token.command.ts

import { ICommand } from "src/core/application/cqrs";

export class GetPinWithQrTokenCommand implements ICommand {

    constructor(
        public readonly qrToken: string
    ){}

}