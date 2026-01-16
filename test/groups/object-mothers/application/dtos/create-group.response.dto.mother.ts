/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\object-mothers\application\dtos\create-group.response.dto.mother.ts

import { CreateGroupResponse } from 'src/groups/application/commands/response-dtos/create-group.response.dto';

/**
 * CreateGroupResponseMother
 * Clase encargada de centralizar la creación de DTOs de respuesta
 * para las pruebas.
 */
export class CreateGroupResponseMother {
  private static readonly GROUP_ID = '7aa6533f-2316-426f-83ec-8b2b85e11262';

  /**
   * Genera una respuesta válida de creación de grupo.
   */
  public static createValid(): CreateGroupResponse {
    return {
      id: this.GROUP_ID,
      name: 'Grupo de Prueba',
      description: 'Descripción del grupo de prueba',
      createdAt: new Date(),
    };
  }

  /**
   * Genera una respuesta con valores específicos.
   */
  public static create(
    id: string,
    name: string,
    description: string,
  ): CreateGroupResponse {
    return {
      id,
      name,
      description,
      createdAt: new Date(),
    };
  }
}
