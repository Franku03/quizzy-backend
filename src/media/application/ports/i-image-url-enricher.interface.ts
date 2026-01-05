//src/media/application/ports/i-image-url-enricher.interface.ts
import { Either, ErrorData } from 'src/core/types';

export interface IImageUrlEnricher {
  resolveUrlsBatch(assetIds: string[]): Promise<Either<ErrorData, Map<string, string>>>;
}