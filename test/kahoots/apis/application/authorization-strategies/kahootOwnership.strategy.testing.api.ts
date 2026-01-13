/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\apis\application\authorization-strategys\kahootOwnership.strategy.testing.api.ts

import { KahootOwnershipAuthorizer } from "src/core/application/aspects/auth/strategies/kahootOwnership.strategy";
import { Either, ErrorData } from "src/core/types";
import { KahootSecurityMother } from "test/kahoots/object-mothers/application/authorization-strategys/kahoowOwnership.strategy.mother";

/**
 * API de soporte para las pruebas unitarias del caso de uso de seguridad (autorización).
 * Se encarga de simular el contexto de seguridad y las peticiones de acceso a recursos.
 */
export class KahootSecurityTestAPI {
    // El SUT es el autorizador de propiedad de Kahoots
    private sut = new KahootOwnershipAuthorizer();
    private resource: unknown = null;
    private result?: Either<ErrorData, unknown>;

    // --- GIVEN: Situaciones de Negocio y Estado del Recurso ---

    /**
     * Define un escenario donde existe un Kahoot con un autor específico.
     */
    public givenAnExistingKahootCreatedBy(authorId: string): this {
        this.resource = KahootSecurityMother.basicKahoot(authorId);
        return this;
    }

    /**
     * Simula un Kahoot en estado de borrador (Draft), generalmente restringido al autor.
     */
    public givenAKahootInDraftStatus(): this {
        this.resource = KahootSecurityMother.draftKahoot();
        return this;
    }

    /**
     * Simula un Kahoot publicado oficialmente para acceso público o compartido.
     */
    public givenAPubliclyPublishedKahoot(): this {
        this.resource = KahootSecurityMother.publicPublishedKahoot();
        return this;
    }

    // --- WHEN: Acciones del Actor (Intento de acceso) ---

    /**
     * Simula el intento de un usuario de realizar una acción específica sobre el recurso.
     * Mapea términos de negocio a nombres de operaciones técnicas del sistema.
     */
    public async whenTheUserTriesToAccessAs(userId: string, accion: string): Promise<this> {
        // Mapeo del lenguaje ubicuo a la operación técnica interna
        const operationMap: Record<string, string> = {
            "ModificarKahoot": "UpdateKahoot",
            "IniciarPartida": "launchSession",
            "VerDetalle": "getKahootUserDetail"
        };

        // Simulación del contexto de persistencia que el autorizador usará para buscar el recurso
        const context = {
            findKahootByIdEither: async () => Either.makeRight(this.resource)
        };

        // Ejecución de la lógica de autorización
        this.result = await this.sut.authorize(
            { 
                id: 'kahoot-id', 
                userId, 
                operationName: operationMap[accion] || accion 
            },
            context as any
        );
        return this;
    }

    // --- THEN: Resultados Esperados (Aserciones) ---

    /**
     * Verifica que la estrategia de seguridad permitió el acceso al recurso.
     */
    public thenAccessShouldBeGranted(): void {
        expect(this.result?.isRight()).toBe(true);
    }

    /**
     * Verifica que el acceso fue denegado y que el mensaje de error es el correcto.
     */
    public thenAccessShouldBeDeniedWith(mensaje: string): void {
        expect(this.result?.isLeft()).toBe(true);
        const errorReceived = this.result?.getLeft().message;
        expect(errorReceived).toContain(mensaje);
    }
}