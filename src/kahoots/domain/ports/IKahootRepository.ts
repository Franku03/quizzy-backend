/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\ports\IKahootRepository.ts

import { Optional } from 'src/core/types/optional';
import { Either, ErrorData } from 'src/core/types';
import { Kahoot } from '../aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';

export interface IKahootRepository {
  // ========== LEGACY (NO TOCAR) ==========
  findKahootById(id: KahootId): Promise<Optional<Kahoot>>;
  // ========== NUEVO CON Either (CON string, NO KahootId) ==========
  // Ahora reciben string puro para desacoplar
  saveKahootEither(kahoot: Kahoot): Promise<Either<ErrorData, void>>;
  findKahootByIdEither(id: string): Promise<Either<ErrorData, Kahoot | null>>;
  findAllKahootsEither(): Promise<Either<ErrorData, Kahoot[]>>;
  deleteKahootEither(id: string): Promise<Either<ErrorData, void>>;
  existsKahootEither(id: string): Promise<Either<ErrorData, boolean>>;
}
