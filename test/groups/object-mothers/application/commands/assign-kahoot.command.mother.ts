/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\object-mothers\application\commands\assign-kahoot.command.mother.ts

import { AssignKahootToGroupCommand } from 'src/groups/application/commands/assign-kahoot/assign-kahoot.command';

/**
 * AssignKahootCommandMother
 * Clase encargada de centralizar la creación de comandos de asignación de kahoots
 * para las pruebas.
 */
export class AssignKahootCommandMother {
  // Valores constantes para asegurar la integridad referencial en los tests
  private static readonly GROUP_ID = '7aa6533f-2316-426f-83ec-8b2b85e11262';
  private static readonly ADMIN_ID = '55b777c7-984e-497c-bc41-4a2a961ad210';
  private static readonly KAHOOT_ID = '9dd0977j-6750-860j-c7ig-cf6f29i55606';

  /**
   * Genera un comando de asignación totalmente válido.
   */
  public static validAssignment(): AssignKahootToGroupCommand {
    const now = new Date();
    const from = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Mañana
    const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // En 7 días

    return new AssignKahootToGroupCommand(
      this.GROUP_ID,
      this.ADMIN_ID,
      this.KAHOOT_ID,
      from,
      to,
    );
  }

  /**
   * Genera un comando de asignación con IDs específicos.
   */
  public static assignment(
    groupId: string,
    userId: string,
    kahootId: string,
  ): AssignKahootToGroupCommand {
    const now = new Date();
    const from = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return new AssignKahootToGroupCommand(groupId, userId, kahootId, from, to);
  }

  /**
   * Genera un comando inválido con fechas invertidas (from > to).
   */
  public static invalidAssignmentWithInvertedDates(): AssignKahootToGroupCommand {
    const now = new Date();
    const from = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // En 7 días
    const to = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Mañana (invertido)

    return new AssignKahootToGroupCommand(
      this.GROUP_ID,
      this.ADMIN_ID,
      this.KAHOOT_ID,
      from,
      to,
    );
  }
}
