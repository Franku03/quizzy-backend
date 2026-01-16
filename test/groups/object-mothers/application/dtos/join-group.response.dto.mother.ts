/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\object-mothers\application\dtos\join-group.response.dto.mother.ts

import { JoinGroupResponse } from 'src/groups/application/commands/response-dtos/join-group.response.dto';
import { GroupMemberRole } from 'src/groups/domain/value-objects/group.member.role';

/**
 * JoinGroupResponseMother
 * Clase encargada de centralizar la creación de DTOs de respuesta
 * para las pruebas.
 */
export class JoinGroupResponseMother {
  private static readonly GROUP_ID = '7aa6533f-2316-426f-83ec-8b2b85e11262';

  /**
   * Genera una respuesta válida de unión a grupo.
   */
  public static createValid(): JoinGroupResponse {
    return {
      groupId: this.GROUP_ID,
      groupName: 'Grupo de Prueba',
      joinedAt: new Date(),
      role: GroupMemberRole.MEMBER,
    };
  }

  /**
   * Genera una respuesta con valores específicos.
   */
  public static create(
    groupId: string,
    groupName: string,
    role: string = GroupMemberRole.MEMBER,
  ): JoinGroupResponse {
    return {
      groupId,
      groupName,
      joinedAt: new Date(),
      role,
    };
  }
}
