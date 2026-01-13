import { UpdateKahootCommand } from 'src/kahoots/application/commands/update-kahoot/update-kahoot.command';
import { KahootSlideCommand } from 'src/kahoots/application/commands/base/base-kahoot-slide.command';
import { KahootOptionCommand } from 'src/kahoots/application/commands/base/base-kahoot-option.command';

/**
 * UpdateKahootCommandMother
 * Clase encargada de centralizar la creación de comandos
 * para las pruebas. Utiliza el patrón Object Mother para desacoplar los tests 
 * de la estructura interna de los comandos.
 */
export class UpdateKahootCommandMother {

    // ID de usuario constante para pruebas controladas de propiedad (Ownership)
    private static readonly USER_ID = "55b777c7-984e-497c-bc41-4a2a961ad210";

    /**
     * Genera un comando de actualización válido para un Kahoot en estado borrador.
     * Mantiene la coherencia de negocio: un DRAFT suele ser PRIVATE.
     */
    static validDraftUpdate(): UpdateKahootCommand {
        return new UpdateKahootCommand({
            id: "7aa6533f-2316-426f-83ec-8b2b85e11262",
            userId: this.USER_ID,
            title: "TEST ACTUALIZADO",
            description: "Descripción corregida.",
            themeId: "5f0e8c89-f434-4dff-baaf-83a4aa4feb26",
            visibility: "PRIVATE", // Coherente con el estado de borrador
            status: "DRAFT",
            slides: [
                new KahootSlideCommand({
                    position: 0,
                    slideType: "SINGLE",
                    points: 1000,
                    timeLimit: 45,
                    question: "SINGLE SLIDE UPDATED",
                    options: [
                        new KahootOptionCommand({ text: "OPTION 1", isCorrect: true }),
                        new KahootOptionCommand({ text: "OPTION 2", isCorrect: false })
                    ]
                })
            ]
        });
    }

    /**
     * Genera un comando inválido que rompe las reglas de visibilidad.
     * Simula el escenario donde se intenta hacer público un Kahoot que sigue en estado DRAFT,
     * lo cual debería disparar una violación de invariantes en el Dominio.
     */
    static invalidPublicDraftUpdate(): UpdateKahootCommand {
        return new UpdateKahootCommand({
            ...this.validDraftUpdate(),
            visibility: "PUBLIC",
            status: "DRAFT" 
        });
    }
}