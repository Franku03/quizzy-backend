/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\ports\i-theme-enricher.interface.ts

import { Either, ErrorData } from 'src/core/types';
import { ThemeObject } from 'src/core/types/theme.object';

export interface IThemeEnricher {
  enrichTheme(assetId: string): Promise<Either<ErrorData, ThemeObject | null>>;
}
