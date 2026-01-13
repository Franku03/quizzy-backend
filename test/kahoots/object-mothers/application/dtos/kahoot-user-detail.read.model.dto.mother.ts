import { KahootUserDetailReadModel } from 'src/kahoots/application/dtos/kahoot-user-detail.read.model.dto';

/**
 * KahootUserDetailMother
 * Clase encargada de centralizar la creación de modelos de lectura (Read Models)
 * para las pruebas. Utiliza el patrón Object Mother para desacoplar los tests 
 * de la estructura de datos que se devuelve en las consultas de detalle.
 */
export class KahootUserDetailMother {

    /**
     * Genera un modelo de lectura de detalle totalmente válido.
     * Representa la información completa que un usuario ve al consultar un Kahoot,
     * incluyendo estadísticas, autoría y estados de juego.
     */
    static valid(): KahootUserDetailReadModel {
        // Identificadores consistentes con el resto de la suite de pruebas
        const id = "7aa6533f-2316-426f-83ec-8b2b85e11262";
        const title = "Título de Prueba";
        const description = "Descripción de Prueba";
        const coverImageId = "516da741-0643-497e-a9ca-6ef952f0e574";
        const visibility = "PUBLIC";
        const themeId = "5f0e8c89-f434-4dff-baaf-83a4aa4feb26";
        
        // Datos de autoría para validaciones de visualización
        const author = { id: "55b777c7-984e-497c-bc41-4a2a961ad210", name: "Luis O." };
        const createdAt = "2026-01-13T03:28:35.583Z";
        
        // Metadatos adicionales de lectura (Read-side)
        const playCount = 150; 
        const category = "Computer Science";
        const status = "PUBLISH";
        
        // Estados específicos del usuario respecto al recurso
        const isInProgress = false;
        const isCompleted = true;
        const isFavorite = false;
        const gameState = null;

        // Instanciación del DTO de aplicación (Read Model)
        return new KahootUserDetailReadModel(
            id,
            title,
            description,
            coverImageId,
            visibility,
            themeId,
            author,
            createdAt,
            playCount,
            category,
            status,
            isInProgress,
            isCompleted,
            isFavorite,
            gameState
        );
    }
}