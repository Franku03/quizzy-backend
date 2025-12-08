// src/kahoots/application/ports/i-kahoot.mapper.port.ts
import { KahootSnapshot } from 'src/core/domain/snapshots/snpapshot.kahoot';
import { KahootHandlerResponse } from '../response/kahoot.handler.response';

export interface IKahootMapper {
  /**
   * Mapea un snapshot de Kahoot a DTO de respuesta
   * Para ambos: commands (después de getSnapshot()) y queries (directo desde DB)
   */
  fromSnapshot(snapshot: KahootSnapshot): Promise<KahootHandlerResponse>;
}