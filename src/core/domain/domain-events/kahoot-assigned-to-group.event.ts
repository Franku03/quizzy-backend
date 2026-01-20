/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\domain-events\kahoot-assigned-to-group.event.ts

import { DomainEvent } from 'src/core/domain/abstractions/domain-event';
import { GroupId } from 'src/groups/domain/value-objects/group.id';
import { KahootId } from '../shared-value-objects/id-objects/kahoot.id';
import { UserId } from '../shared-value-objects/id-objects/user.id';

export class KahootAssignedToGroupEvent extends DomainEvent {
  constructor(
    public readonly groupId: GroupId,
    public readonly kahootId: KahootId,
    public readonly assignedBy: UserId,
    public readonly availableFrom: Date,
    public readonly availableUntil: Date,
    public readonly groupName?: string,
    public readonly kahootTitle?: string,
    public readonly assignerName?: string,
    public readonly memberIds?: string[],
  ) {
    super(KahootAssignedToGroupEvent.name);
  }
}
