/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\ports\IMultiplayerSessionHistoryRepository.ts

import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { MultiplayerSession } from '../aggregates/multiplayer-session';
import { Either, ErrorData } from 'src/core/types';

// Repositorio para las operaciones de larga duración que involucran persistencia (guardado final).
export interface IMultiplayerSessionHistoryRepository {
  
  // ========== LEGACY (NO TOCAR) ==========
  archiveSession(session: MultiplayerSession, kahoot: Kahoot ): Promise<void>;

  // ========== VERSION ROP CON EITHER ==========
  archiveSessionEither(session: MultiplayerSession, kahoot: Kahoot ): Promise<Either<ErrorData, void>>
  
}
