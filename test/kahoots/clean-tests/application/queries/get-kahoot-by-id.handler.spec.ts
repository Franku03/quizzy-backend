/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\clean-tests\application\queries\get-kahoot-by-id.handler.spec.ts

import { GetKahootByIdTestAPI } from "../../../apis/application/queries/get-kahoot-by-id.testing.api";

/**
 * Suite de pruebas para GetKahootByIdHandler.
 * Se enfoca en validar el flujo de recuperación y transformación de datos (Read Side).
 */
describe('GetKahootByIdHandler (Clean Architecture Specification)', () => {
    let api: GetKahootByIdTestAPI;

    // Inicialización de la API de testing para aislar cada caso de prueba
    beforeEach(() => {
        api = new GetKahootByIdTestAPI();
    });

    /**
     * Escenario: Recuperación exitosa de un Kahoot.
     * Verifica que el SUT orqueste el enriquecimiento de media y el mapeo al DTO de salida.
     */
    it('debería retornar los datos del kahoot cuando el usuario tiene permisos de acceso', async () => {
        await api
            .givenAnExistingKahootSnapshot() // Simula que el recurso existe en la BD
            .givenAValidGetKahootQuery()     // Query preparada con el recurso inyectado
            .whenExecutingQuery();           // Ejecución del SUT (Query Handler)

        // Verifica que el resultado sea Right y se hayan llamado a los colaboradores
        api.thenShouldReturnKahootData();
    });
});