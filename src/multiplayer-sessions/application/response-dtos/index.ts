/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\index.ts

// Response DTOs
export * from './create-session.response.dto';
export * from './get-pin-with-qr-token.response.dto';

export * from './game-ended.response.dto';
export * from './question-started.response.dto';
export * from './question-results.response.dto';

export * from './player-submit-answer.response.dto';
export * from './lobby-state-update.response.dto';
export * from './sync-state.response.dto';

// Types and Enums
export * from './enums/host-next-phase-type.enum';
export * from './enums/sync-type.enum';
export * from './types/host-next-phase-response.type';
export * from './types/sync-data.type';