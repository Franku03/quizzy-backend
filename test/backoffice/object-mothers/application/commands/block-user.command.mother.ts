/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

import { BlockUserCommand } from 'src/backoffice/application/commands/block-user/block-user.command';

/**
 * BlockUserCommandMother
 */
export class BlockUserCommandMother {
  private static readonly ADMIN_ID = 'admin-1234-5678-9012-345678901234';
  private static readonly USER_ID = 'user-1234-5678-9012-345678901234';

  /**
   * Métodos públicos para acceder a las constantes privadas
   */
  public static getUserId(): string {
    return this.USER_ID;
  }

  public static getAdminId(): string {
    return this.ADMIN_ID;
  }

  /**
   * Comando donde admin intenta bloquearse a sí mismo
   */
  static adminBlocksHimself(): BlockUserCommand {
    return new BlockUserCommand(this.ADMIN_ID, this.ADMIN_ID);
  }

  /**
   * Comando válido donde admin bloquea a otro usuario
   */
  static valid(): BlockUserCommand {
    return new BlockUserCommand(this.ADMIN_ID, this.USER_ID);
  }
}
