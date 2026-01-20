/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\mappers\index.ts

export * from './map-entries-to-results-response';
export * from './map-final-scoreboard';
export * from './map-join-to-lobby-update';
export * from './map-to-question-response';

// SYNC STATE MAPPERS
export * from './map-question-to-sync-state';
export * from './map-results-to-sync-state'
export * from './map-end-to-sync-state';
export * from './map-lobby-to-sync-state';