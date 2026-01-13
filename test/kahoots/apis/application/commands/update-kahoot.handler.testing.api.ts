/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\apis\application\commands\update-kahoot.handler.testing.api.ts

import { mock, MockProxy } from 'jest-mock-extended';
import { Either, ErrorData } from 'src/core/types';
import { ErrorLayer } from 'src/core/errors/error.enum';

// --- Capa de Dominio ---
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';

// --- Capa de Aplicación (SUT y Dependencias) ---
import { UpdateKahootCommand } from 'src/kahoots/application/commands/update-kahoot/update-kahoot.command';
import { UpdateKahootHandler } from 'src/kahoots/application/commands/update-kahoot/update-kahoot.handler';
import { IKahootOwnershipRequest } from 'src/core/application/aspects/auth/strategies/kahootOwnership.strategy';
import { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { AttemptCleanupService } from 'src/kahoots/application/services/attempt-clear.service';
import { KahootHandlerResponseDto } from 'src/kahoots/application/dtos/kahoot.handler.response.dto';

// --- Object Mothers ---
import { KahootResponseMother } from '../../../object-mothers/application/dtos/kahoot.handler.response.dto.mother';
import { UpdateKahootCommandMother } from '../../../object-mothers/application/commands/update-kahoot.command.mother';
import { KahootAggregateMother } from 'test/kahoots/object-mothers/domain/aggregate/kahoot.mother';

/**
 * Definimos la unión de tipos para representar el comando validado por seguridad.
 * Esto representa el comando después de pasar por los interceptores de seguridad.
 */
type SecureUpdateCommand = UpdateKahootCommand & IKahootOwnershipRequest;

/**
 * API de soporte para las pruebas unitarias del caso de uso de update kahoot.
 */
export class UpdateKahootTestAPI {
    // --- Mocks de dependencias (Puertos de Infraestructura y Servicios) ---
    private repoMock: MockProxy<IKahootRepository> = mock<IKahootRepository>();
    private mapperMock: MockProxy<IMapper<KahootSnapshot, KahootHandlerResponseDto>> = mock<IMapper<KahootSnapshot, KahootHandlerResponseDto>>();
    private idGenMock: MockProxy<IdGenerator<string>> = mock<IdGenerator<string>>();
    private mediaMock: MockProxy<MediaEnrichmentService> = mock<MediaEnrichmentService>();
    private cleanupMock: MockProxy<AttemptCleanupService> = mock<AttemptCleanupService>();
    private loggerMock: MockProxy<ILogger> = mock<ILogger>();

    // --- Estado interno de la prueba ---
    private result?: Either<ErrorData, KahootHandlerResponseDto>;
    private currentCommand?: SecureUpdateCommand;
    private existingKahoot?: Kahoot;

    constructor() {
        this.configureDefaultMocks();
    }

    /**
     * Configuración base de los mocks para asegurar un flujo de éxito por defecto.
     */
    private configureDefaultMocks(): void {
        this.idGenMock.generateId.mockReturnValue("550e8400-e29b-41d4-a716-446655440000");
        this.mediaMock.enrichKahoot.mockImplementation(async (snapshot) => snapshot);
        this.mapperMock.map.mockReturnValue(KahootResponseMother.createValid());
        this.cleanupMock.cleanupById.mockResolvedValue(void 0);
        this.repoMock.saveKahootEither.mockResolvedValue(Either.makeRight(undefined));
    }

    // ============ GIVEN: Configuración de Escenarios ============

    /**
     * Configura el repositorio para guardar los cambios exitosamente.
     */
    public givenTheSystemIsReadyToUpdateData(): this {
        this.repoMock.saveKahootEither.mockResolvedValue(Either.makeRight(undefined));
        return this;
    }

    /**
     * Simula un fallo de infraestructura en el repositorio.
     */
    public givenTheStorageIsDown(message: string): this {
        const error = new ErrorData('INFRA_ERROR', message, ErrorLayer.INFRASTRUCTURE);
        this.repoMock.saveKahootEither.mockResolvedValue(Either.makeLeft(error));
        return this;
    }

    /**
     * Prepara un Kahoot en estado borrador (Draft) dentro del repositorio.
     */
    public givenAnExistingDraftKahoot(): this {
        this.existingKahoot = KahootAggregateMother.existingDraft();
        this.repoMock.findKahootByIdEither.mockResolvedValue(Either.makeRight(this.existingKahoot));
        return this;
    }

    /**
     * Prepara un comando de actualización válido.
     */
    public givenAValidUpdateKahootCommand(): this {
        return this.buildSecureCommand(UpdateKahootCommandMother.validDraftUpdate());
    }

    /**
     * Prepara un comando que intenta actualizar un borrador a público de forma inválida.
     */
    public givenAnInvalidPublicDraftUpdateCommand(): this {
        return this.buildSecureCommand(UpdateKahootCommandMother.invalidPublicDraftUpdate());
    }

    /**
     * Construcción Type-Safe del comando inyectando los datos de propiedad y recurso validado.
     */
    private buildSecureCommand(base: UpdateKahootCommand): this {
        const resource = this.getExistingKahoot();
        
        this.currentCommand = {
            ...base,
            operationName: 'UpdateKahoot',
            validatedResource: resource,
            userId: resource.authorId // Simula que el usuario solicitante es el autor
        };

        return this;
    }

    // ============ WHEN: Ejecución de la acción ============

    /**
     * Instancia el UpdateKahootHandler (SUT) y ejecuta la lógica del caso de uso.
     */
    public async whenUpdatingKahoot(): Promise<this> {
        const handler = new UpdateKahootHandler(
            this.repoMock, this.mapperMock, this.mediaMock,
            this.cleanupMock, this.idGenMock, this.loggerMock
        );
        this.result = await handler.execute(this.getCurrentCommand());
        return this;
    }

    // ============ THEN: Verificaciones y Expectativas ============

    /**
     * Verifica que el Kahoot se actualizó y persistió correctamente.
     */
    public thenShouldBeUpdated(): void {
        expect(this.repoMock.saveKahootEither).toHaveBeenCalled();
        expect(this.result?.isRight()).toBe(true);
    }

    /**
     * Verifica que la operación falló debido a una violación de política de negocio.
     */
    public thenShouldFailDueToViolationOf(message: string): void {
        expect(this.result?.isLeft()).toBe(true);
        const error = this.result?.getLeft();
        expect(error?.message.toLowerCase()).toContain(message.toLowerCase());
    }

    /**
     * Verifica que se disparó el servicio de limpieza de intentos tras la actualización.
     */
    public thenCleanupShouldBeTriggered(): void {
        expect(this.cleanupMock.cleanupById).toHaveBeenCalled();
    }

    // ============ HELPERS ============

    private getExistingKahoot(): Kahoot {
        if (!this.existingKahoot) throw new Error("Falta: givenAnExistingDraftKahoot()");
        return this.existingKahoot;
    }

    private getCurrentCommand(): SecureUpdateCommand {
        if (!this.currentCommand) throw new Error("Falta configurar el comando");
        return this.currentCommand;
    }
}