import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { KahootFactory } from 'src/kahoots/domain/factories/kahoot.factory';
import { KahootSnapshotData, KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { SlideTypeEnum } from "src/kahoots/domain/value-objects/kahoot.slide.type";
import { VisibilityStatusEnum } from 'src/kahoots/domain/value-objects/kahoot.visibility-status';
import { KahootStatusEnum } from 'src/kahoots/domain/value-objects/kahoot.status';
import { KahootCategoryEnum } from 'src/kahoots/domain/value-objects/kahoot.details';

/**
 * KahootAggregateMother
 * Clase encargada de centralizar la creación de Agregados de Dominio para las pruebas.
 * Utiliza la factoría del dominio para reconstruir objetos con estado interno,
 * permitiendo testear comportamientos sobre recursos ya existentes.
 */
export class KahootAggregateMother {
    // IDs CONSTANTES: Facilitan la coincidencia de datos entre el comando del test y el mock del repositorio
    public static readonly AUTHOR_ID = "55b777c7-984e-497c-bc41-4a2a961ad210";
    public static readonly KAHOOT_ID = "7aa6533f-2316-426f-83ec-8b2b85e11262";
    public static readonly THEME_ID = "7aa6533f-2316-426f-83ec-8b2b85e11263";
    public static readonly IMAGE_ID = "7aa6533f-2316-426f-83ec-8b2b85e11264";

    /**
     * Genera un Agregado de Kahoot en estado Borrador (DRAFT + PRIVATE).
     * Representa un recurso recién creado que aún no está listo para el público.
     */
    static existingDraft(): Kahoot {
        const raw = this.baseRawData();
        raw.status = 'DRAFT';
        raw.visibility = 'PRIVATE';
        return this.reconstruct(raw);
    }

    /**
     * Genera un Agregado de Kahoot en estado Publicado (PUBLISH + PUBLIC).
     * Representa un recurso finalizado que debería permitir acciones de juego y visualización.
     */
    static existingPublished(): Kahoot {
        const raw = this.baseRawData();
        raw.status = 'PUBLISH';
        raw.visibility = 'PUBLIC';
        return this.reconstruct(raw);
    }

    /**
     * Utiliza la factory de dominio para reconstruir el Agregado a partir de un Snapshot.
     * Garantiza que el objeto devuelto cumpla con todas las reglas de negocio.
     */
    private static reconstruct(data: KahootSnapshotData): Kahoot {
        const snapshot = KahootSnapshot.fromRaw(data);
        const result = KahootFactory.reconstructFromSnapshot(snapshot);
        
        if (result.isLeft()) {
            throw new Error(`Mother Error: ${result.getLeft().message}`);
        }
        
        return result.getRight();
    }

    /**
     * Proporciona la estructura base de datos crudos para un Kahoot.
     * Evita la duplicación de código al definir las propiedades comunes del recurso.
     */
    private static baseRawData(): KahootSnapshotData {
        return {
            id: this.KAHOOT_ID,
            authorId: this.AUTHOR_ID,
            createdAt: "2026-01-13T03:28:35.583Z",
            playCount: 0,
            visibility: VisibilityStatusEnum.PRIVATE,
            status: KahootStatusEnum.DRAFT,
            styling: {
                themeId: this.THEME_ID,
                imageId: this.IMAGE_ID,
            },
            details: {
                title: "KAHOOT TEST",
                description: "Descripción honesta.",
                category: KahootCategoryEnum.COMPUTER_SCIENCE
            },
            slides: [
                {
                    id: "82b43571-56e8-4029-9811-2e30163dac01",
                    position: 0,
                    slideType: SlideTypeEnum.SINGLE,
                    timeLimitSeconds: 20,
                    questionText: "Pregunta del Mother",
                    pointsValue: 1000,
                    options: [
                        { optionText: "Correcta", isCorrect: true },
                        { optionText: "Falsa", isCorrect: false }
                    ]
                }
            ]
        };
    }
}