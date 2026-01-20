/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\object-mothers\application\commands\delete-kahoot.command.mother.ts

import { DeleteKahootCommand } from 'src/kahoots/application/commands';

/**
 * DeleteKahootCommandMother
 * Clase encargada de centralizar la creación de comandos
 * para las pruebas. Utiliza el patrón Object Mother para desacoplar los tests
 * de la estructura interna de los comandos.
 */
export class DeleteKahootCommandMother {
  // Valores constantes para asegurar la integridad referencial y repetibilidad en los tests
  private static readonly VALID_KAHOOT_ID =
    '550e8400-e29b-41d4-a716-446655440000';
  private static readonly VALID_USER_ID =
    '123e4567-e89b-12d3-a456-426614174000';
  private static readonly OTHER_USER_ID =
    '78901234-5678-9012-3456-789012345678';

  /**
   * Factory base para crear el comando con tipado estricto.
   * Centraliza la instanciación para facilitar cambios futuros en el constructor.
   */
  static create(id: string, userId: string): DeleteKahootCommand {
    return new DeleteKahootCommand({ id, userId });
  }

  /**
   * Genera un comando de eliminación válido.
   * Representa el escenario donde el dueño legítimo solicita borrar su Kahoot.
   */
  static valid(): DeleteKahootCommand {
    return this.create(this.VALID_KAHOOT_ID, this.VALID_USER_ID);
  }

  /**
   * Genera un comando donde el usuario NO es el autor del recurso.
   * Útil para validar políticas de seguridad y denegación de acceso (Ownership).
   */
  static unauthorizedUser(): DeleteKahootCommand {
    return this.create(this.VALID_KAHOOT_ID, this.OTHER_USER_ID);
  }

  /**
   * Genera un comando con un UUID válido en formato pero inexistente en el sistema.
   * Permite testear la respuesta del servicio ante recursos que no se encuentran.
   */
  static withNonExistentId(): DeleteKahootCommand {
    return this.create(
      '99999999-9999-9999-9999-999999999999',
      this.VALID_USER_ID,
    );
  }
}
