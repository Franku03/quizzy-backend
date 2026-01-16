/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\domain\ports\IMassMessageRepository.ts

import { Either, ErrorData } from 'src/core/types';
import { MassMessage } from '../aggregates/mass.message';

export interface IMassMessageRepository {
  save(message: MassMessage): Promise<Either<ErrorData, void>>;
}
