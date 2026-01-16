/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\object-mothers\application\commands\create-group.command.mother.ts

import { CreateGroupCommand } from 'src/groups/application/commands/create-group/create-group.command';

/**
 * CreateGroupCommandMother
 * Clase encargada de centralizar la creación de comandos
 * para las pruebas. Utiliza el patrón Object Mother para desacoplar los tests
 * de la estructura interna de los comandos.
 */
export class CreateGroupCommandMother {
  // Valores constantes para asegurar la integridad referencial en los tests
  private static readonly ADMIN_ID = '55b777c7-984e-497c-bc41-4a2a961ad210';

  /**
   * Genera un comando de creación totalmente válido para un Group.
   * Cumple con todas las invariants del dominio.
   */
  public static validGroup(): CreateGroupCommand {
    return new CreateGroupCommand(
      'Grupo de Prueba',
      this.ADMIN_ID,
      'Descripción del grupo de prueba',
    );
  }

  /**
   * Genera un comando de creación con un admin ID específico.
   */
  public static validGroupWithAdmin(adminId: string): CreateGroupCommand {
    return new CreateGroupCommand(
      'Grupo de Prueba',
      adminId,
      'Descripción del grupo de prueba',
    );
  }

  /**
   * Genera un comando de creación sin descripción (opcional).
   */
  public static validGroupWithoutDescription(): CreateGroupCommand {
    return new CreateGroupCommand('Grupo Simple', this.ADMIN_ID);
  }

  /**
   * Genera un comando inválido sin adminId.
   * Simula el error de validación donde falta el admin requerido.
   */
  public static invalidGroupWithoutAdmin(): CreateGroupCommand {
    return new CreateGroupCommand('Grupo Sin Admin', '', 'Descripción');
  }

  /**
   * Genera un comando con nombre inválido (muy corto, < 3 caracteres).
   */
  public static invalidGroupWithShortName(): CreateGroupCommand {
    return new CreateGroupCommand('Ab', this.ADMIN_ID, 'Descripción');
  }

  /**
   * Genera un comando con nombre inválido (muy largo, > 20 caracteres).
   */
  public static invalidGroupWithLongName(): CreateGroupCommand {
    return new CreateGroupCommand(
      'Este es un nombre de grupo muy largo que excede el límite permitido de veinte caracteres',
      this.ADMIN_ID,
      'Descripción',
    );
  }
}
