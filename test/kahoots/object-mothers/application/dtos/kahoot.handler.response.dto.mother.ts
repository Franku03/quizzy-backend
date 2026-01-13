import { KahootHandlerResponseDto } from 'src/kahoots/application/dtos/kahoot.handler.response.dto';

/**
 * KahootResponseMother
 * Clase encargada de centralizar la creación de DTOs de respuesta (Data Transfer Objects)
 * para las pruebas. Utiliza el patrón Object Mother para desacoplar los tests 
 * de la estructura de salida de los casos de uso.
 */
export class KahootResponseMother {

    // ID de usuario constante para mantener la coherencia con otros Mothers
    private static readonly USER_ID = "55b777c7-984e-497c-bc41-4a2a961ad210";

    /**
     * Genera un DTO de respuesta válido y completo.
     * Simula el resultado final que devuelve un Application Service tras mapear
     * un Agregado de Dominio a un objeto de transferencia.
     */
    public static createValid(): KahootHandlerResponseDto {
        const response = new KahootHandlerResponseDto();
        
        // Datos básicos de identificación y auditoría
        response.id = "550e8400-e29b-41d4-a716-446655440000";
        response.authorId = this.USER_ID;
        response.createdAt = new Date().toISOString();
        response.playCount = 0;
        
        // Estado y metadatos descriptivos
        response.status = "Publish";
        response.visibility = "Public";
        response.title = "TEST DDD KAHOOT";
        response.category = "Computer Science";
        
        /**
         * Estructura detallada de preguntas (slides).
         * Refleja el resultado del mapeo de diapositivas del dominio a la vista de aplicación.
         */
        response.questions = [
            {
                id: "slide-uuid-1",
                text: "PREGUNTA VÁLIDA",
                type: "single",
                timeLimit: 45,
                points: 1000,
                position: 0,
                mediaId: null,
                answers: [
                    { id: "0", text: "Opción Correcta", isCorrect: true, mediaId: null },
                    { id: "1", text: "Opción Incorrecta", isCorrect: false, mediaId: null }
                ]
            }
        ];

        return response;
    }
}