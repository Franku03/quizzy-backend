/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\clean-tests\application\commands\create-kahoot.handler.spec.ts

import { CreateKahootTestAPI } from "../../../apis/application/commands/create-kahoot.handler.testing.api";

/**
 * Suite de pruebas para CreateKahootHandler.
 * Se utiliza un enfoque de Especificación Ejecutable donde el código describe 
 * el comportamiento esperado del negocio.
 */
describe('CreateKahootHandler (Clean Architecture Specification)', () => {
    let api: CreateKahootTestAPI;

    // Inicialización de la API de testing antes de cada caso para asegurar aislamiento
    beforeEach(() => {
        api = new CreateKahootTestAPI();
    });

    /**
     * Escenario: Flujo feliz (Happy Path).
     * Valida que un comando válido resulte en una persistencia efectiva.
     */
    it('debería persistir el kahoot cuando la solicitud es válida y el sistema está operativo', async () => {
        await api
            .givenTheSystemIsReadyToStoreData() // Prepara el repo (Right)
            .givenAValidKahootCreationRequest() // Carga comando válido del Mother
            .whenCreatingKahoot();              // Ejecuta el SUT

        api.thenShouldBePersisted(); // Verifica llamada al repo e isRight()
    });

    /**
     * Escenario: Violación de Regla de Negocio.
     * Valida que el Agregado de Dominio rechace la creación si falta la respuesta correcta.
     */
    it('debería rechazar la creación cuando un slide de seleccion simple no tiene respuestas correctas', async () => {
        await api
            .givenTheSystemIsReadyToStoreData()
            .givenAKahootCreationRequestWithoutCorrectAnswers() // Comando inválido
            .whenCreatingKahoot();

        // Verifica que el error provenga de la lógica de negocio del Agregado
        api.thenShouldFailDueToViolationOf("kahoot -> single choice slide must have at least one (1) correct option.");
    });

    /**
     * Escenario: Error de Infraestructura.
     * Valida que los errores técnicos del repositorio se capturen como fallos controlados.
     */
    it('debería informar el error si el almacenamiento falla', async () => {
        await api
            .givenTheStorageIsDown('Timeout Error') // Simula fallo en el Repo (Left)
            .givenAValidKahootCreationRequest()
            .whenCreatingKahoot();

        api.thenShouldFailDueToViolationOf('Timeout Error');
    });
});