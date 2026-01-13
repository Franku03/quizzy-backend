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