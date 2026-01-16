/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\clean-tests\application\commands\join-group.handler.spec.ts

import { JoinGroupTestAPI } from '../../../apis/application/commands/join-group.handler.testing.api';

/**
 * Suite de pruebas para JoinGroupHandler.
 * Se utiliza un enfoque de Especificación Ejecutable donde el código describe
 * el comportamiento esperado del negocio.
 */
describe('JoinGroupHandler (Clean Architecture Specification)', () => {
  let api: JoinGroupTestAPI;

  // Inicialización de la API de testing antes de cada caso para asegurar aislamiento
  beforeEach(() => {
    api = new JoinGroupTestAPI();
  });

  /**
   * Escenario: Flujo feliz (Happy Path).
   * Valida que un usuario pueda unirse a un grupo con token válido.
   */
  it('debería permitir unirse al grupo cuando el token es válido y el usuario existe', async () => {
    await api
      .givenTheSystemIsReadyToStoreData() // Prepara el repo (Right)
      .givenAnExistingGroupWithValidInvitation() // Grupo con token válido
      .givenAValidJoinRequest() // Carga comando válido del Mother
      .whenJoiningGroup(); // Ejecuta el SUT

    api.thenShouldJoinSuccessfully(); // Verifica llamada al repo e isRight()
  });

  /**
   * Escenario: Violación de Regla de Negocio.
   * Valida que el Agregado de Dominio rechace la unión si el grupo tiene 5 miembros
   * y el admin no es premium (límite de miembros alcanzado).
   */
  it('debería rechazar la unión cuando el grupo tiene 5 miembros y el admin no es premium', async () => {
    await api
      .givenTheSystemIsReadyToStoreData()
      .givenAGroupWithMaximumMembers() // Grupo con 5 miembros
      .givenAValidJoinRequest() // Comando válido
      .whenJoiningGroup();

    // Verifica que el error provenga de la lógica de negocio del Agregado
    api.thenShouldFailDueToViolationOf(
      'El grupo no puede tener más de 5 miembros si el admin no es premium.',
    );
  });

  /**
   * Escenario: Error de Infraestructura.
   * Valida que los errores técnicos del repositorio se capturen como fallos controlados.
   */
  it('debería informar el error si el almacenamiento falla', async () => {
    await api
      .givenTheStorageIsDown('Timeout Error') // Simula fallo en el Repo (Left)
      .givenAValidJoinRequest()
      .whenJoiningGroup();

    api.thenShouldFailDueToViolationOf('Timeout Error');
  });
});
