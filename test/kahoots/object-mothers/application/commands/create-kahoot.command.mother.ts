import { CreateKahootCommand, KahootSlideCommand, KahootOptionCommand } from 'src/kahoots/application/commands';

/**
 * KahootCommandMother
 * Clase encargada de centralizar la creación de comandos
 * para las pruebas. Utiliza el patrón Object Mother para desacoplar los tests 
 * de la estructura interna de los comandos.
 */
export class KahootCommandMother {
    // Valores constantes para asegurar la integridad referencial en los tests
    private static readonly USER_ID = "55b777c7-984e-497c-bc41-4a2a961ad210";
    private static readonly THEME_ID = "5f0e8c89-f434-4dff-baaf-83a4aa4feb26";

    /**
     * Genera un comando de creación totalmente válido para un Kahoot público.
     * Cumple con todas las invariants del dominio.
     */
    public static validPublicKahoot(): CreateKahootCommand {
        return new CreateKahootCommand({
            userId: this.USER_ID,
            themeId: this.THEME_ID,
            title: "TEST DDD KAHOOT",
            description: "Descripción válida",
            category: "Computer Science",
            visibility: "PUBLIC",
            status: "PUBLISH",
            slides: [this.createValidSlide()]
        });
    }

    /**
     * Genera un comando inválido para un Kahoot con estado PUBLISH.
     * Simula el error de negocio donde ninguna opción de la diapositiva es marcada como correcta.
     */
    public static invalidPublicNoCorrectAnswer(): CreateKahootCommand {
        const command = this.validPublicKahoot();
        return new CreateKahootCommand({
            ...command,
            slides: [new KahootSlideCommand({
                position: 0,
                slideType: "SINGLE",
                timeLimit: 45,
                points: 1000,
                question: "PREGUNTA SIN CORRECTA",
                // Se envían opciones existentes pero todas con isCorrect en false
                options: [
                    new KahootOptionCommand({ text: "Incorrecta 1", isCorrect: false}),
                    new KahootOptionCommand({ text: "Incorrecta 2", isCorrect: false })
                ]
            })]
        });
    }

    /**
     * @private
     * Método auxiliar para crear una diapositiva (slide) que cumple con los requisitos mínimos.
     */
    private static createValidSlide(): KahootSlideCommand {
        return new KahootSlideCommand({
            position: 0,
            slideType: "SINGLE",
            timeLimit: 45,
            points: 1000,
            question: "PREGUNTA VÁLIDA",
            options: [
                new KahootOptionCommand({ text: "Correcta", isCorrect: true }),
                new KahootOptionCommand({ text: "Incorrecta", isCorrect: false })
            ]
        });
    }
}