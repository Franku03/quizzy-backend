/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\apis\application\commands\delete-kahoot.handler.testing.api.ts

import { mock, MockProxy } from 'jest-mock-extended';
import { Either, ErrorData } from 'src/core/types';
import { ErrorLayer } from 'src/core/errors/error.enum';

// --- Capa de Dominio ---
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';

// --- Capa de Aplicación (SUT y Contratos) ---
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot/delete-kahoot.command';
import { DeleteKahootHandler } from 'src/kahoots/application/commands/delete-kahoot/delete-kahoot.handler';
import { IKahootOwnershipRequest } from 'src/core/application/aspects/auth/strategies/kahootOwnership.strategy';
import { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { AttemptCleanupService } from 'src/kahoots/application/services/attempt-clear.service';

// --- Object Mothers ---
import { DeleteKahootCommandMother } from 'test/kahoots/object-mothers/application/commands/delete-kahoot.command.mother';
import { KahootAggregateMother } from 'test/kahoots/object-mothers/domain/aggregate/kahoot.mother';

/**
 * Definimos la unión de tipos para representar el comando validado por seguridad.
 * Al igual que en Update, esto evita el uso de 'any'.
 */
type SecureDeleteCommand = DeleteKahootCommand & IKahootOwnershipRequest;

/**
 * API de soporte para las pruebas unitarias del caso de uso de delete kahoot.
 */
export class DeleteKahootTestAPI {
    // --- Mocks de dependencias (Puertos de Infraestructura) ---
    private repoMock: MockProxy<IKahootRepository> = mock<IKahootRepository>();
    private cleanupMock: MockProxy<AttemptCleanupService> = mock<AttemptCleanupService>();
    private loggerMock: MockProxy<ILogger> = mock<ILogger>();

    // --- Estado interno de la prueba ---
    private result?: Either<ErrorData, void>;
    private currentCommand?: SecureDeleteCommand;
    private existingKahoot?: Kahoot;

    constructor() {
        this.configureDefaultMocks();
    }

    /**
     * Configuración base de los mocks para evitar errores por dependencias no configuradas.
     */
    private configureDefaultMocks(): void {
        this.cleanupMock.cleanupById.mockResolvedValue(void 0);
        // Por defecto, el borrado funciona
        this.repoMock.deleteKahootEither.mockResolvedValue(Either.makeRight(undefined));
    }

    // ============ GIVEN: Configuración de Escenarios ============

    /**
     * Configura el repositorio para un borrado exitoso.
     */
    public givenTheSystemIsReadyToDeleteData(): this {
        this.repoMock.deleteKahootEither.mockResolvedValue(Either.makeRight(undefined));
        return this;
    }

    /**
     * Simula un fallo de infraestructura (ej. la base de datos no responde).
     */
    public givenTheStorageIsDown(message: string): this {
        const error = new ErrorData('INFRA_ERROR', message, ErrorLayer.INFRASTRUCTURE);
        this.repoMock.deleteKahootEither.mockResolvedValue(Either.makeLeft(error));
        return this;
    }

    /**
     * Prepara un Kahoot existente que será el objetivo de la eliminación.
     */
    public givenAnExistingKahoot(): this {
        this.existingKahoot = KahootAggregateMother.existingDraft();
        return this;
    }

    /**
     * Crea el comando seguro inyectando el recurso validado y el ID de usuario.
     */
    public givenAValidDeleteKahootCommand(): this {
        return this.buildSecureCommand(DeleteKahootCommandMother.valid());
    }

    /**
     * Construcción Type-Safe del comando con los datos de propiedad.
     */
    private buildSecureCommand(base: DeleteKahootCommand): this {
        const resource = this.getExistingKahoot();

        this.currentCommand = {
            ...base,
            operationName: 'DeleteKahoot',
            validatedResource: resource,
            userId: resource.authorId // El ID que pide borrar coincide con el dueño
        };

        return this;
    }

    // ============ WHEN: Ejecución de la acción ============

    /**
     * Instancia el caso de uso (SUT) y ejecuta la lógica de aplicación.
     */
    public async whenDeletingKahoot(): Promise<this> {
        const handler = new DeleteKahootHandler(
            this.repoMock,
            this.cleanupMock,
            this.loggerMock
        );
        this.result = await handler.execute(this.getCurrentCommand());
        return this;
    }

    // ============ THEN: Verificaciones y Expectativas ============

    /**
     * Verifica que el borrado fue exitoso y se notificó al repositorio.
     */
    public thenShouldBeDeleted(): void {
        expect(this.repoMock.deleteKahootEither).toHaveBeenCalled();
        expect(this.result?.isRight()).toBe(true);
    }

    /**
     * Verifica que la operación falló con el mensaje indicado.
     */
    public thenShouldFailDueTo(message: string): void {
        expect(this.result?.isLeft()).toBe(true);
        const error = this.result?.getLeft();
        expect(error?.message.toLowerCase()).toContain(message.toLowerCase());
    }

    /**
     * Verifica que se disparó la limpieza de intentos del Kahoot.
     */
    public thenCleanupShouldBeTriggered(): void {
        expect(this.cleanupMock.cleanupById).toHaveBeenCalled();
    }

    // ============ HELPERS ============

    private getExistingKahoot(): Kahoot {
        if (!this.existingKahoot) throw new Error("Falta: givenAnExistingKahoot()");
        return this.existingKahoot;
    }

    private getCurrentCommand(): SecureDeleteCommand {
        if (!this.currentCommand) throw new Error("Falta configurar el comando");
        return this.currentCommand;
    }
}