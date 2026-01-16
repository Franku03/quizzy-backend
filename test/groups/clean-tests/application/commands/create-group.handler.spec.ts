/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\groups\clean-tests\application\commands\create-group.handler.spec.ts

import { CreateGroupTestAPI } from '../../../apis/application/commands/create-group.handler.testing.api';

/**
 * Suite de pruebas para CreateGroupHandler.
 * Se utiliza un enfoque de Especificación Ejecutable donde el código describe
 * el comportamiento esperado del negocio.
 */
describe('CreateGroupHandler (Clean Architecture Specification)', () => {
  let api: CreateGroupTestAPI;

  // Inicialización de la API de testing antes de cada caso para asegurar aislamiento
  beforeEach(() => {
    api = new CreateGroupTestAPI();
  });

  /**
   * Escenario: Flujo feliz (Happy Path).
   * Valida que un comando válido resulte en una persistencia efectiva.
   */
  it('debería persistir el grupo cuando la solicitud es válida y el sistema está operativo', async () => {
    await api
      .givenTheSystemIsReadyToStoreData() // Prepara el repo (Right)
      .givenAValidGroupCreationRequest() // Carga comando válido del Mother
      .whenCreatingGroup(); // Ejecuta el SUT

    api.thenShouldBePersisted(); // Verifica llamada al repo e isRight()
  });

  /**
   * Escenario: Violación de Regla de Negocio.
   * Valida que el Agregado de Dominio rechace la creación si el nombre es inválido.
   */
  it('debería rechazar la creación cuando el nombre del grupo es muy corto', async () => {
    await api
      .givenTheSystemIsReadyToStoreData()
      .givenAGroupCreationRequestWithInvalidName() // Comando inválido
      .whenCreatingGroup();

    // Verifica que el error provenga de la lógica de negocio del Agregado
    api.thenShouldFailDueToViolationOf(
      'El nombre del grupo debe tener entre 3 y 20 caracteres.',
    );
  });

  /**
   * Escenario: Error de Infraestructura.
   * Valida que los errores técnicos del repositorio se capturen como fallos controlados.
   */
  it('debería informar el error si el almacenamiento falla', async () => {
    await api
      .givenTheStorageIsDown('Timeout Error') // Simula fallo en el Repo (Left)
      .givenAValidGroupCreationRequest()
      .whenCreatingGroup();

    api.thenShouldFailDueToViolationOf('Timeout Error');
  });
});
