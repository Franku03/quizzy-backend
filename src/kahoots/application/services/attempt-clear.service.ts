/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\services\attempt-clear.service.ts

import { Inject } from '@nestjs/common';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';

export class AttemptCleanupService {
  constructor(
    @Inject(RepositoryName.Attempt)
    private readonly attemptRepository: SoloAttemptRepository
  ) {}

  async cleanupById(kahootId: KahootId): Promise<void> {
    try {
      await this.attemptRepository.deleteAllActiveForKahootId(kahootId);
    } catch (error) {
      console.warn(`No se pudieron limpiar intentos para kahoot ${kahootId.value}:`, error);
    }
  }
}