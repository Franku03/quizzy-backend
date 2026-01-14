/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\apis\application\commands\create-kahoot.handler.testing.api.ts

import { mock, MockProxy } from 'jest-mock-extended';
import { Either, ErrorData } from 'src/core/types';
import { ErrorLayer } from 'src/core/errors/error.enum';

// --- Capa de Dominio ---
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';

// --- Capa de Aplicación (SUT y Dependencias) ---
import { CreateKahootCommand } from 'src/kahoots/application/commands';
import { CreateKahootHandler } from 'src/kahoots/application/commands/create-kahoot/create-kahoot.handler';
import { KahootHandlerResponseDto } from 'src/kahoots/application/dtos/kahoot.handler.response.dto';
import { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

// --- Object Mothers (Datos predefinidos para pruebas) ---
import { KahootResponseMother } from '../../../object-mothers/application/dtos/kahoot.handler.response.dto.mother';
import { KahootCommandMother } from '../../../object-mothers/application/commands/create-kahoot.command.mother';

/**
 * API de soporte para las pruebas unitarias del caso de uso "Crear Kahoot".
 */
export class CreateKahootTestAPI {
  // Definición de Mocks para los puertos de los que depende el servicio de aplicación
  private repoMock: MockProxy<IKahootRepository> = mock<IKahootRepository>();
  private mapperMock: MockProxy<
    IMapper<KahootSnapshot, KahootHandlerResponseDto>
  > = mock<IMapper<KahootSnapshot, KahootHandlerResponseDto>>();
  private idGenMock: MockProxy<IdGenerator<string>> =
    mock<IdGenerator<string>>();
  private mediaMock: MockProxy<MediaEnrichmentService> =
    mock<MediaEnrichmentService>();
  private loggerMock: MockProxy<ILogger> = mock<ILogger>();

  // Estado interno para almacenar el estímulo (comando) y la respuesta del SUT
  private result?: Either<ErrorData, KahootHandlerResponseDto>;
  private currentCommand?: CreateKahootCommand;

  constructor() {
    this.configureDefaultMocks();
  }

  /**
   * Establece una configuración base para los mocks.
   * Permite que el servicio funcione en un escenario de "éxito" por defecto.
   */
  private configureDefaultMocks(): void {
    this.idGenMock.generateId.mockReturnValue(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    this.mediaMock.enrichKahoot.mockImplementation((snapshot) =>
      Promise.resolve(snapshot),
    );
    this.mapperMock.map.mockReturnValue(KahootResponseMother.createValid());
  }

  // ============ GIVEN: Definición de Escenarios ============

  /**
   * Simula que el repositorio de infraestructura funciona correctamente.
   */
  public givenTheSystemIsReadyToStoreData(): this {
    this.repoMock.saveKahootEither.mockResolvedValue(Either.makeRight(void 0));
    return this;
  }

  /**
   * Simula un error crítico en la capa de persistencia (Infraestructura).
   */
  public givenTheStorageIsDown(message = 'Database Connection Timeout'): this {
    const error = new ErrorData(
      'INFRASTRUCTURE_ERROR',
      message,
      ErrorLayer.INFRASTRUCTURE,
    );
    this.repoMock.saveKahootEither.mockResolvedValue(Either.makeLeft(error));
    return this;
  }

  /**
   * Prepara un comando válido para ser procesado por el caso de uso.
   */
  public givenAValidKahootCreationRequest(): this {
    this.currentCommand = KahootCommandMother.validPublicKahoot();
    return this;
  }

  /**
   * Prepara un comando que fallará debido a reglas de negocio (sin respuestas correctas).
   */
  public givenAKahootCreationRequestWithoutCorrectAnswers(): this {
    this.currentCommand = KahootCommandMother.invalidPublicNoCorrectAnswer();
    return this;
  }

  // ============ WHEN: Ejecución del Caso de Uso (SUT) ============

  /**
   * Ejecuta el CreateKahootHandler (System Under Test).
   * Instancia el servicio con los mocks actuales y dispara la acción.
   */
  public async whenCreatingKahoot(): Promise<this> {
    if (!this.currentCommand) {
      throw new Error(
        "No se ha configurado un comando. Usa métodos 'given...Request'",
      );
    }

    const handler = new CreateKahootHandler(
      this.repoMock,
      this.mapperMock,
      this.idGenMock,
      this.mediaMock,
      this.loggerMock,
    );

    this.result = await handler.execute(this.currentCommand);
    return this;
  }

  // ============ THEN: Verificaciones ============

  /**
   * Verifica que el flujo terminó correctamente y los datos llegaron al repositorio.
   */
  public thenShouldBePersisted(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(this.repoMock.saveKahootEither).toHaveBeenCalled();
    expect(this.result?.isRight()).toBe(true);
  }

  /**
   * Verifica que el servicio detuvo la creación debido a una violación de política.
   */
  public thenShouldFailDueToViolationOf(policyMessage: string): void {
    expect(this.result?.isLeft()).toBe(true);
    const error = this.result?.getLeft();
    expect(error?.message.toLowerCase()).toContain(policyMessage.toLowerCase());
  }
}
