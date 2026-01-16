/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\object-mothers\application\commands\join-group.command.mother.ts

import { JoinGroupCommand } from 'src/groups/application/commands/join-group/join-group.command';

/**
 * JoinGroupCommandMother
 * Clase encargada de centralizar la creación de comandos de unión a grupos
 * para las pruebas.
 */
export class JoinGroupCommandMother {
  // Valores constantes para asegurar la integridad referencial en los tests
  private static readonly USER_ID = '8bb7644g-3427-537g-94fd-9c3c96f22373';
  private static readonly VALID_TOKEN = 'valid-token-12345';

  /**
   * Genera un comando de unión totalmente válido para un Group.
   */
  public static validJoinRequest(): JoinGroupCommand {
    return new JoinGroupCommand(this.USER_ID, this.VALID_TOKEN);
  }

  /**
   * Genera un comando de unión con un usuario específico.
   */
  public static validJoinRequestWithUser(userId: string): JoinGroupCommand {
    return new JoinGroupCommand(userId, this.VALID_TOKEN);
  }

  /**
   * Genera un comando de unión con un token específico.
   */
  public static validJoinRequestWithToken(token: string): JoinGroupCommand {
    return new JoinGroupCommand(this.USER_ID, token);
  }

  /**
   * Genera un comando de unión con usuario y token específicos.
   */
  public static joinRequest(userId: string, token: string): JoinGroupCommand {
    return new JoinGroupCommand(userId, token);
  }

  /**
   * Genera un comando inválido con token vacío.
   */
  public static invalidJoinRequestWithEmptyToken(): JoinGroupCommand {
    return new JoinGroupCommand(this.USER_ID, '');
  }

  /**
   * Genera un comando inválido con token inválido.
   */
  public static invalidJoinRequestWithInvalidToken(): JoinGroupCommand {
    return new JoinGroupCommand(this.USER_ID, 'invalid-token-99999');
  }
}
