/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\domain\domain-events\user-password-changed.event.ts

import { DomainEvent } from "src/core/domain/abstractions/domain-event";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { UserEmail } from "../value-objects/user.email";

export class UserPasswordChangedEvent extends DomainEvent {
    static readonly EVENT_NAME = 'user.password.changed';

    constructor(
        public readonly userId: UserId,
        public readonly email: UserEmail,
    ) {
        super(UserPasswordChangedEvent.EVENT_NAME);
    }
}