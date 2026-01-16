/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

import { BlockUserTestAPI } from 'test/backoffice/apis/application/commands/block-user.handler.testing.api';

/**
 * Suite de pruebas MINIMA para BlockUserHandler
 * Solo prueba los 2 escenarios solicitados
 */
describe('BlockUserHandler', () => {
  let api: BlockUserTestAPI;

  beforeEach(() => {
    api = new BlockUserTestAPI();
  });

  describe('ESCENARIO 1: Usuario no puede bloquearse a sí mismo', () => {
    it('debería fallar cuando un administrador intenta bloquearse a sí mismo', async () => {
      // Arrange: Admin intenta bloquearse a sí mismo
      api.givenAdminTriesToBlockHimself();

      // Act: Ejecutar el bloqueo
      await api.whenBlockingUser();

      // Assert: Debe fallar con el mensaje específico
      api.thenShouldFailDueToSelfBlock();
    });
  });

  describe('ESCENARIO 2: Usuario debe marcarse como bloqueado', () => {
    it('debería marcar al usuario como bloqueado cuando la operación es exitosa', async () => {
      // Arrange: Usuario activo, sistema listo, comando válido
      api
        .givenAnActiveUserExists()
        .givenTheSystemSavesBlockedUser()
        .givenAValidBlockUserCommand();

      // Act: Ejecutar el bloqueo
      await api.whenBlockingUser();

      // Assert: Verificar todo el flujo de bloqueo
      api.thenShouldBeSuccessfullyBlocked(); // 1. Operación exitosa
      api.thenUserShouldBeMarkedAsBlocked(); // 2. Método block() llamado
      api.thenUserShouldBeSaved(); // 3. Usuario guardado
      api.thenReadModelShouldBeBlocked(); // 4. Read model muestra "Blocked"
    });
  });
});
