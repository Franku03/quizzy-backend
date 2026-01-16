/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\clean-tests\application\commands\assign-kahoot.handler.spec.ts

import { AssignKahootTestAPI } from '../../../apis/application/commands/assign-kahoot.handler.testing.api';

/**
 * Suite de pruebas para AssignKahootToGroupHandler.
 * Se utiliza un enfoque de Especificación Ejecutable donde el código describe
 * el comportamiento esperado del negocio.
 */
describe('AssignKahootToGroupHandler (Clean Architecture Specification)', () => {
  let api: AssignKahootTestAPI;

  // Inicialización de la API de testing antes de cada caso para asegurar aislamiento
  beforeEach(() => {
    api = new AssignKahootTestAPI();
  });

  /**
   * Escenario: Flujo feliz (Happy Path).
   * Valida que un admin pueda asignar un kahoot publicado a su grupo.
   */
  it('debería asignar el kahoot al grupo cuando el admin lo solicita, el kahoot existe y está publicado', async () => {
    await api
      .givenTheSystemIsReadyToStoreData() // Prepara el repo (Right)
      .givenAnExistingGroupWhereUserIsAdmin() // Grupo donde el usuario es admin
      .givenAnExistingPublishedKahoot() // Kahoot publicado
      .givenAValidAssignKahootRequest() // Carga comando válido del Mother
      .whenAssigningKahoot(); // Ejecuta el SUT

    api.thenShouldAssignSuccessfully(); // Verifica llamada al repo e isRight()
  });

  /**
   * Escenario: Violación de Regla de Negocio.
   * Valida que el Agregado de Dominio rechace la asignación si el kahoot ya está asignado.
   */
  it('debería rechazar la asignación cuando el kahoot ya está asignado al grupo', async () => {
    await api
      .givenTheSystemIsReadyToStoreData()
      .givenAGroupWithKahootAlreadyAssigned() // Grupo con kahoot ya asignado
      .givenAnExistingPublishedKahoot()
      .givenAValidAssignKahootRequest() // Comando válido
      .whenAssigningKahoot();

    // Verifica que el error provenga de la lógica de negocio del Agregado
    api.thenShouldFailDueToViolationOf('El kahoot ya está asignado al grupo.');
  });

  /**
   * Escenario: Error de Infraestructura.
   * Valida que los errores técnicos del repositorio se capturen como fallos controlados.
   */
  it('debería informar el error si el almacenamiento falla', async () => {
    await api
      .givenTheStorageIsDown('Timeout Error') // Simula fallo en el Repo (Left)
      .givenAValidAssignKahootRequest()
      .whenAssigningKahoot();

    api.thenShouldFailDueToViolationOf('Timeout Error');
  });
});
