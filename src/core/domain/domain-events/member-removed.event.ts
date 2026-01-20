/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\domain-events\member-removed.event.ts

import { DomainEvent } from '../abstractions/domain-event';

export class MemberRemovedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly groupId: string,
    public readonly removedBy: string,
  ) {
    super(MemberRemovedEvent.name);
  }
}
