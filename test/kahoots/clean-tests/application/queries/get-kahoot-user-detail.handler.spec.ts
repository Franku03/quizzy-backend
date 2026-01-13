/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\clean-tests\application\queries\get-kahoot-user-detail.handler.spec.ts

import { GetKahootUserDetailTestAPI } from "../../../apis/application/queries/get-kahoot-user-detail.testing.api";

/**
 * Suite de pruebas para GetKahootUserDetailHandler.
 * Valida la obtención de información detallada y personalizada del Kahoot para un usuario.
 */
describe('GetKahootUserDetailHandler (Clean Architecture Specification)', () => {
    let api: GetKahootUserDetailTestAPI;

    // Inicialización de la API de testing para asegurar independencia entre pruebas
    beforeEach(() => {
        api = new GetKahootUserDetailTestAPI();
    });

    /**
     * Escenario: Consulta de detalle con éxito.
     * Verifica que el SUT retorne el ReadModel enriquecido con metadatos multimedia.
     */
    it('debería retornar el detalle para retornar un progreso del kahoot cuando el usuario tiene permisos', async () => {
        await api
            .givenAnExistingUserDetailReadModel() // Carga un ReadModel desde el Mother
            .givenAValidGetDetailQuery()          // Prepara la Query segura (SecureDetailQuery)
            .whenExecutingQuery();                // Ejecución del SUT (Handler)

        // Aserción: El Either es Right, el ID coincide y se llamó al MediaService
        api.thenShouldReturnUserDetail();
    });
});