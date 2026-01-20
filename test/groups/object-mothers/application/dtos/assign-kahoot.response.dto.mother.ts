/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\object-mothers\application\dtos\assign-kahoot.response.dto.mother.ts

import { AssignKahootToGroupResponse } from 'src/groups/application/commands/response-dtos/assign-kahoot.response.dto';

/**
 * AssignKahootResponseMother
 * Clase encargada de centralizar la creación de DTOs de respuesta
 * para las pruebas.
 */
export class AssignKahootResponseMother {
  private static readonly GROUP_ID = '7aa6533f-2316-426f-83ec-8b2b85e11262';
  private static readonly ADMIN_ID = '55b777c7-984e-497c-bc41-4a2a961ad210';
  private static readonly KAHOOT_ID = '9dd0977j-6750-860j-c7ig-cf6f29i55606';

  /**
   * Genera una respuesta válida de asignación de kahoot.
   */
  public static createValid(): AssignKahootToGroupResponse {
    const now = new Date();
    const from = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      groupId: this.GROUP_ID,
      quizId: this.KAHOOT_ID,
      assignedBy: this.ADMIN_ID,
      availableFrom: from,
      availableTo: to,
    };
  }

  /**
   * Genera una respuesta con valores específicos.
   */
  public static create(
    groupId: string,
    quizId: string,
    assignedBy: string,
    availableFrom: Date,
    availableTo: Date,
  ): AssignKahootToGroupResponse {
    return {
      groupId,
      quizId,
      assignedBy,
      availableFrom,
      availableTo,
    };
  }
}
