import { KahootSecurityTestAPI } from "../../../apis/application/authorization-strategys/kahootOwnership.strategy.testing.api";

/**
 * Suite de pruebas para KahootOwnershipAuthorizer.
 * Valida las políticas de seguridad y acceso basadas en el propietario y el estado del recurso.
 */
describe('Seguridad de Kahoots  (Clean Architecture Specification)', () => {
    let api: KahootSecurityTestAPI;

    // Inicialización de la API de seguridad antes de cada test
    beforeEach(() => {
        api = new KahootSecurityTestAPI();
    });

    /**
     * Escenario: Autorización por Propiedad.
     * El usuario "A" debe poder editar el recurso que le pertenece a "A".
     */
    it('debería permitir el acceso cuando el autor legítimo intenta gestionar su propio kahoot', async () => {
        await api
            .givenAnExistingKahootCreatedBy("autor-1")
            .whenTheUserTriesToAccessAs("autor-1", "ModificarKahoot");

        api.thenAccessShouldBeGranted(); // Resultado: Right(resource)
    });

    /**
     * Escenario: Denegación por Propiedad.
     * Un usuario malintencionado o ajeno no debe poder editar recursos de terceros.
     */
    it('debería denegar el acceso cuando un extraño intenta modificar un kahoot ajeno', async () => {
        await api
            .givenAnExistingKahootCreatedBy("autor-1")
            .whenTheUserTriesToAccessAs("extrano-99", "ModificarKahoot");

        api.thenAccessShouldBeDeniedWith("Access denied."); // Resultado: Left(ErrorData)
    });

    /**
     * Escenario: Restricción por Estado de Negocio.
     * Aunque el usuario sea válido, la acción "Iniciar Partida" requiere que el Kahoot no sea DRAFT.
     */
    it('debería prohibir el inicio de una partida si el kahoot aún es un borrador', async () => {
        await api
            .givenAKahootInDraftStatus()
            .whenTheUserTriesToAccessAs("cualquier-jugador", "IniciarPartida");

        api.thenAccessShouldBeDeniedWith("Cannot launch session from draft.");
    });

    /**
     * Escenario: Acceso Público.
     * Valida que la lectura de detalles sea permisiva si el Kahoot es público.
     */
    it('debería permitir que cualquier usuario vea un kahoot que ha sido publicado y es público', async () => {
        await api
            .givenAPubliclyPublishedKahoot()
            .whenTheUserTriesToAccessAs("usuario-anonimo", "VerDetalle");

        api.thenAccessShouldBeGranted();
    });
});