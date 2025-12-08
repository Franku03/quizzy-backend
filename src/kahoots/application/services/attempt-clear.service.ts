// src/kahoots/application/services/attempt-cleanup.service.ts
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