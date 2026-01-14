/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: test\kahoots\apis\application\queries\get-kahoot-by-id.testing.api.ts

import { mock, MockProxy } from 'jest-mock-extended';
import { Either, ErrorData } from 'src/core/types';

// --- Capa de Dominio & Snapshots ---
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { KahootHandlerResponseDto } from 'src/kahoots/application/dtos/kahoot.handler.response.dto';

// --- Capa de Aplicación (SUT y Puertos) ---
import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';
import { GetKahootByIdHandler } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.handler';
import { IKahootOwnershipRequest } from 'src/core/application/aspects/auth/strategies/kahootOwnership.strategy';
import { IKahootDao } from 'src/kahoots/application/ports/i-kahoot.dao.interface';
import { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';

// --- Object Mothers ---
import { GetKahootByIdQueryMother } from 'test/kahoots/object-mothers/application/queries/get-kahoot-by-id.query.mother';
import { KahootResponseMother } from 'test/kahoots/object-mothers/application/dtos/kahoot.handler.response.dto.mother';
import { KahootAggregateMother } from 'test/kahoots/object-mothers/domain/aggregate/kahoot.mother';

/**
 * Unión de tipos para representar la Query enriquecida por la estrategia de seguridad.
 */
type SecureGetQuery = GetKahootByIdQuery & IKahootOwnershipRequest;

/**
 * API de soporte para las pruebas unitarias del caso de uso de get kahoot.
 */
export class GetKahootByIdTestAPI {
  // --- Mocks de dependencias (Puertos y Servicios de Aplicación) ---
  private daoMock: MockProxy<IKahootDao> = mock<IKahootDao>();
  private mapperMock: MockProxy<
    IMapper<KahootSnapshot, KahootHandlerResponseDto>
  > = mock<IMapper<KahootSnapshot, KahootHandlerResponseDto>>();
  private mediaMock: MockProxy<MediaEnrichmentService> =
    mock<MediaEnrichmentService>();
  private loggerMock: MockProxy<ILogger> = mock<ILogger>();

  // --- Estado interno de la prueba ---
  private result?: Either<ErrorData, KahootHandlerResponseDto>;
  private currentQuery?: SecureGetQuery;
  private existingSnapshot?: KahootSnapshot;

  constructor() {
    this.configureDefaultMocks();
  }

  /**
   * Configuración base de los mocks para garantizar un flujo exitoso por defecto.
   */
  private configureDefaultMocks(): void {
    this.mediaMock.enrichKahoot.mockImplementation((snapshot: KahootSnapshot) =>
      Promise.resolve(snapshot),
    );
    this.mapperMock.map.mockReturnValue(KahootResponseMother.createValid());
  }

  // ============ GIVEN: Escenarios de Estado ============

  /**
   * Simula la existencia de un Kahoot publicado recuperando su snapshot.
   */
  public givenAnExistingKahootSnapshot(): this {
    const aggregate = KahootAggregateMother.existingPublished();
    this.existingSnapshot = aggregate.getSnapshot();
    return this;
  }

  /**
   * Prepara una Query segura inyectando el snapshot validado y los datos del usuario.
   */
  public givenAValidGetKahootQuery(): this {
    const snapshot = this.getSnapshotOrThrow();
    const base = GetKahootByIdQueryMother.valid();

    this.currentQuery = {
      kahootId: base.kahootId,
      operationName: 'GetKahootById',
      validatedResource: snapshot,
      userId: base.userId ?? 'anonymous-user-id',
    } as SecureGetQuery;

    return this;
  }

  // ============ WHEN: Ejecución de la acción (SUT) ============

  /**
   * Instancia el GetKahootByIdHandler y ejecuta la Query.
   */
  public async whenExecutingQuery(): Promise<this> {
    const handler = new GetKahootByIdHandler(
      this.daoMock,
      this.mapperMock,
      this.mediaMock,
      this.loggerMock,
    );
    this.result = await handler.execute(this.getCurrentQueryOrThrow());
    return this;
  }

  // ============ THEN: Verificaciones ============

  /**
   * Verifica que la Query retornó datos válidos y se ejecutaron los procesos de mapeo y media.
   */
  public thenShouldReturnKahootData(): void {
    expect(this.result?.isRight()).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(this.mediaMock.enrichKahoot).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(this.mapperMock.map).toHaveBeenCalled();
  }

  // ============ HELPERS: Acceso Seguro ============

  private getSnapshotOrThrow(): KahootSnapshot {
    if (!this.existingSnapshot)
      throw new Error('Falta: givenAnExistingKahootSnapshot()');
    return this.existingSnapshot;
  }

  private getCurrentQueryOrThrow(): SecureGetQuery {
    if (!this.currentQuery) throw new Error('Falta configurar la Query');
    return this.currentQuery;
  }
}
