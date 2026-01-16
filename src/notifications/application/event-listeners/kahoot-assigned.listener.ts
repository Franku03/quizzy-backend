/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\application\event-listeners\kahoot-assigned.listener.ts

import { KahootAssignedEvent } from 'src/core/domain/domain-events/kahoot-assigned.event';
import { NotifyKahootAssignedUseCase } from '../use-cases/notify-kahoot-assigned.use-case';

export class KahootAssignedListener {
    constructor(
        private readonly notifyKahootAssignedUseCase: NotifyKahootAssignedUseCase
    ) { }

    public async on(event: KahootAssignedEvent): Promise<void> {
        await this.notifyKahootAssignedUseCase.execute(event);
    }
}
