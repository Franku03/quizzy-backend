import { DeleteKahootTestAPI } from "../../../apis/application/commands/delete-kahoot.handler.testing.api";

/**
 * Suite de pruebas para DeleteKahootHandler.
 * Valida la orquestación del borrado de Kahoots y la limpieza de datos relacionados.
 */
describe('DeleteKahootHandler (Clean Architecture Specification)', () => {
    let api: DeleteKahootTestAPI;

    // Inicialización de la API de testing para garantizar un entorno limpio en cada test
    beforeEach(() => {
        api = new DeleteKahootTestAPI();
    });

    /**
     * Escenario: Eliminación exitosa por parte del propietario.
     * Verifica que el servicio coordine el borrado y la limpieza de intentos.
     */
    it('debería eliminar el kahoot cuando el dueño lo solicita y el sistema está operativo', async () => {
        await api
            .givenTheSystemIsReadyToDeleteData() // Stub: Repo responderá Right
            .givenAnExistingKahoot()           // Prepara el agregado en el estado del test
            .givenAValidDeleteKahootCommand()  // Simula el comando post-autorización (dueño ok)
            .whenDeletingKahoot();             // Ejecución del SUT

        api.thenShouldBeDeleted();             // Aserción: El Either es Right y se llamó al repo
        api.thenCleanupShouldBeTriggered();    // Aserción: Se invocó al servicio de limpieza
    });

    /**
     * Escenario: Fallo en la capa de persistencia.
     * Verifica la propagación de errores de infraestructura.
     */
    it('debería informar el error si el almacenamiento falla durante la eliminación', async () => {
        await api
            .givenTheStorageIsDown('Database connection failure') // Stub: Repo responderá Left
            .givenAnExistingKahoot()
            .givenAValidDeleteKahootCommand()
            .whenDeletingKahoot();

        api.thenShouldFailDueTo('Database connection failure'); // Aserción: El Either es Left
    });
});