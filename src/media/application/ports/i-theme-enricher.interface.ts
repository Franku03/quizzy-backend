// src/media/application/ports/i-theme-enricher.interface.ts
import { Either, ErrorData } from 'src/core/types';
import { ThemeObject } from 'src/core/types/theme.object';


export interface IThemeEnricher {
  enrichTheme(assetId: string): Promise<Either<ErrorData, ThemeObject | null>>;
}