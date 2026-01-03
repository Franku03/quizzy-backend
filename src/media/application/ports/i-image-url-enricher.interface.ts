//src/media/application/ports/i-image-url-enricher.interface.ts
import { Either, ErrorData } from 'src/core/types';

export interface IImageUrlEnricher {
  /**
   * Recibe una lista de IDs y retorna un mapa { assetId: url }.
   * Usamos Map para acceso O(1).
   */
  resolveUrlsBatch(assetIds: string[]): Promise<Either<ErrorData, Map<string, string>>>;
}