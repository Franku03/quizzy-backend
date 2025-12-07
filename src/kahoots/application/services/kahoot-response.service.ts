// src/kahoots/application/services/kahoot-response.service.ts
import { Injectable } from '@nestjs/common';
import type { IKahootMapper } from '../ports/i-kahoot-mapper.port';
import { KahootAssetEnricherService } from './kahoot-asset-enricher.service';
import { Kahoot } from '../../domain/aggregates/kahoot';
import { KahootSnapshot } from 'src/core/domain/snapshots/snpapshot.kahoot';
import { KahootHandlerResponse } from '../response/kahoot.handler.response';

@Injectable()
export class KahootResponseService {
  constructor(
    private readonly kahootMapper: IKahootMapper,
    private readonly assetEnricher: KahootAssetEnricherService
  ) {}

  /**
   * Convierte un Kahoot de dominio a respuesta enriquecida
   */
  public async toResponse(kahoot: Kahoot): Promise<KahootHandlerResponse> {
    const snapshot = kahoot.getSnapshot();
    return this.fromSnapshot(snapshot);
  }

  /**
   * Convierte un snapshot a respuesta enriquecida
   */
  public async fromSnapshot(snapshot: KahootSnapshot): Promise<KahootHandlerResponse> {
    // 1. Mapear a respuesta básica (solo IDs)
    const plainResponse = await this.kahootMapper.fromSnapshot(snapshot);
    
    // 2. Enriquecer con URLs
    return this.assetEnricher.enrich(plainResponse);
  }

  /**
   * Convierte múltiples Kahoots de dominio a respuestas enriquecidas
   */
  public async toResponseBatch(kahoots: Kahoot[]): Promise<KahootHandlerResponse[]> {
    const snapshots = kahoots.map(kahoot => kahoot.getSnapshot());
    return this.fromSnapshotBatch(snapshots);
  }

  /**
   * Convierte múltiples snapshots a respuestas enriquecidas (batch)
   */
  public async fromSnapshotBatch(snapshots: KahootSnapshot[]): Promise<KahootHandlerResponse[]> {
    // 1. Mapear todos a respuestas básicas
    const plainResponses = await Promise.all(
      snapshots.map(snapshot => this.kahootMapper.fromSnapshot(snapshot))
    );
    
    // 2. Enriquecer en batch (más eficiente)
    return this.assetEnricher.enrichMultiple(plainResponses);
  }

  /**
   * Convierte un Kahoot a respuesta sin enriquecer (para debugging/testing)
   */
  public async toPlainResponse(kahoot: Kahoot): Promise<KahootHandlerResponse> {
    const snapshot = kahoot.getSnapshot();
    return this.kahootMapper.fromSnapshot(snapshot);
  }
}