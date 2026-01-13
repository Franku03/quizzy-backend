/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\object-mothers\application\authorization-strategys\kahoowOwnership.strategy.mother.ts

import { KahootStatusEnum } from "src/kahoots/domain/value-objects/kahoot.status";
import { VisibilityStatusEnum } from "src/kahoots/domain/value-objects/kahoot.visibility-status";

/**
 * KahootSecurityMother
 * Clase encargada de crear representaciones ligeras de Kahoots para pruebas de seguridad.
 * Utiliza el patrón Object Mother para suministrar los datos necesarios a las
 * estrategias de autorización (Authorizers) sin cargar todo el agregado.
 */
export class KahootSecurityMother {
    
    /**
     * Genera un recurso básico con un autor dinámico.
     * Útil para testear escenarios de "Mismo Usuario" vs "Usuario Diferente"
     * sobre un Kahoot publicado.
     */
    static basicKahoot(authorId: string) {
        return { 
            authorId, 
            status: KahootStatusEnum.PUBLISH, 
            visibility: VisibilityStatusEnum.PUBLIC 
        };
    }

    /**
     * Genera un recurso en estado de borrador (DRAFT) y privado.
     * Representa un Kahoot que aún no ha sido finalizado y cuya visibilidad
     * debe estar restringida estrictamente al autor.
     */
    static draftKahoot() {
        return { 
            authorId: 'propietario-1', 
            status: KahootStatusEnum.DRAFT, 
            visibility: VisibilityStatusEnum.PRIVATE 
        };
    }

    /**
     * Genera un recurso publicado y de visibilidad pública.
     * Representa un Kahoot finalizado que permite acciones de lectura y juego
     * por parte de usuarios terceros (no autores).
     */
    static publicPublishedKahoot() {
        return { 
            authorId: 'propietario-1', 
            status: KahootStatusEnum.PUBLISH, 
            visibility: VisibilityStatusEnum.PUBLIC
        };
    }
}