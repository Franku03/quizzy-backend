/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\clean-tests\application\commands\update-kahoot.handler.spec.ts

import { UpdateKahootTestAPI } from '../../../apis/application/commands/update-kahoot.handler.testing.api';

/**
 * Suite de pruebas para UpdateKahootHandler.
 * Valida la lógica de orquestación, actualización de reglas de dominio y limpieza de datos.
 */
describe('UpdateKahootHandler (Clean Architecture Specification)', () => {
  let api: UpdateKahootTestAPI;

  // Inicialización de la Testing API antes de cada test para aislar el estado
  beforeEach(() => {
    api = new UpdateKahootTestAPI();
  });

  /**
   * Escenario: Actualización exitosa.
   * Verifica que el SUT coordine la persistencia y la limpieza de intentos.
   */
  it('debería actualizar el kahoot cuando la solicitud es válida y el sistema está operativo', async () => {
    await api
      .givenTheSystemIsReadyToUpdateData() // Mock del Repo: Responderá Right
      .givenAnExistingDraftKahoot() // Carga el Agregado inicial del Mother
      .givenAValidUpdateKahootCommand() // Carga el estímulo válido del Mother
      .whenUpdatingKahoot(); // Ejecución del SUT

    api.thenShouldBeUpdated(); // Verifica persistencia exitosa
    api.thenCleanupShouldBeTriggered(); // Verifica disparo de limpieza (Cleanup)
  });

  /**
   * Escenario: Violación de Invariantes de Dominio.
   * El test confirma que el Handler no permite estados inconsistentes (DRAFT + PUBLIC).
   */
  it('debería rechazar la actualización cuando se violan reglas de integridad (DRAFT no puede ser PUBLIC)', async () => {
    await api
      .givenTheSystemIsReadyToUpdateData()
      .givenAnExistingDraftKahoot()
      .givenAnInvalidPublicDraftUpdateCommand() // Comando con incoherencia DRAFT/PUBLIC
      .whenUpdatingKahoot();

    // El error viene directamente de la lógica del Agregado de Dominio
    api.thenShouldFailDueToViolationOf(
      'kahoot -> a draft kahoot cannot be public.',
    );
  });

  /**
   * Escenario: Fallo técnico de infraestructura.
   * Verifica que el Handler maneje correctamente el fallo del Repositorio.
   */
  it('debería informar el error si el almacenamiento falla', async () => {
    await api
      .givenTheStorageIsDown('Timeout Error') // Mock del Repo: Responderá Left
      .givenAnExistingDraftKahoot()
      .givenAValidUpdateKahootCommand()
      .whenUpdatingKahoot();

    api.thenShouldFailDueToViolationOf('Timeout Error');
  });
});
