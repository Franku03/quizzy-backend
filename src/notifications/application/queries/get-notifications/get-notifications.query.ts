/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\application\queries\get-notifications\get-notifications.query.ts

import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetNotificationsQuery implements IQuery {
    constructor(
        public readonly userId: string,
        public readonly limit: number,
        public readonly page: number,
    ) {}
}
