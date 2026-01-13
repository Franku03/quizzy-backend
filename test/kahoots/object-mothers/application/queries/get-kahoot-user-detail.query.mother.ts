/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\object-mothers\application\queries\get-kahoot-user-detail.query.mother.ts

import { KahootUserDetailReadModel } from "src/kahoots/application/dtos/kahoot-user-detail.read.model.dto";
import { GetKahootUserDetailById } from "src/kahoots/application/queries/get-kahoot-preview-by-id/get-kahoot-user-detail-by-id.query";

/**
 * Unión de tipos para representar la Query validada con su ReadModel inyectado.
 * Simula el estado de la Query tras pasar por los guards o interceptores de seguridad.
 */
export type SecureDetailQuery = GetKahootUserDetailById & { 
    validatedResource: KahootUserDetailReadModel 
};

/**
 * GetKahootUserDetailQueryMother
 * Clase encargada de centralizar la creación de queries para las pruebas de detalle.
 * Utiliza el patrón Object Mother para desacoplar los tests de la construcción
 * de objetos complejos y tipos extendidos de infraestructura.
 */
export class GetKahootUserDetailQueryMother {
    
    /**
     * Genera una query "segura" vinculada a un modelo de lectura existente.
     * Este objeto representa el estado de una consulta que ya ha sido validada 
     * y enriquecida por la capa de seguridad/interceptores.
     */
    public static valid(resource: KahootUserDetailReadModel): SecureDetailQuery {
        return {
            kahootId: resource.id,
            userId: resource.author.id,
            validatedResource: resource
        };
    }

    /**
     * Genera una query básica de dominio (sin recurso pre-validado).
     * Útil para escenarios de error, validación de IDs o pruebas de fallo en la capa de aplicación.
     */
    public static simple(kahootId: string, userId: string): GetKahootUserDetailById {
        return {
            kahootId,
            userId
        };
    }
}