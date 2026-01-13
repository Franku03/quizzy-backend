import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';

/**
 * GetKahootByIdQueryMother
 * Clase encargada de centralizar la creación de consultas para obtener Kahoots por ID.
 * Al igual que KahootCommandMother, abstrae la creación de objetos de consulta 
 * para mantener los tests limpios y mantenibles.
 */
export class GetKahootByIdQueryMother {
    // Identificadores estáticos para asegurar consistencia en las aserciones de los tests
    private static readonly VALID_ID = "550e8400-e29b-41d4-a716-446655440000";
    private static readonly USER_ID = "123e4567-e89b-12d3-a456-426614174000";

    /**
     * Genera una consulta válida con un usuario autenticado.
     * Útil para probar escenarios de recuperación de Kahoots privados o 
     * donde la propiedad del recurso es relevante.
     */
    static valid(): GetKahootByIdQuery {
        return new GetKahootByIdQuery({
            kahootId: this.VALID_ID,
            userId: this.USER_ID
        });
    }

    /**
     * Genera una consulta para un acceso anónimo (sin userId).
     * Permite testear la lógica de visibilidad pública del dominio cuando 
     * no hay una sesión de usuario activa.
     */
    static anonymous(): GetKahootByIdQuery {
        return new GetKahootByIdQuery({
            kahootId: this.VALID_ID,
            userId: undefined
        });
    }
}