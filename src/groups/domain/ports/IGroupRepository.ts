/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\domain\ports\IGroupRepository.ts

import { Optional } from "src/core/types/optional";
import { Group } from "src/groups/domain/aggregates/group";

export interface IGroupRepository {
    save(group: Group): Promise<void>;
    findById(groupId: string): Promise<Optional<Group>>;
    findByMemberAndKahoot(userId: string, kahootId: string): Promise<Group[]>;
    findByInvitationToken(token: string): Promise<Optional<Group>>;
    delete(groupId: string): Promise<void>;
}