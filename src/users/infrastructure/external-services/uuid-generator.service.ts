/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\infrastructure\external-services\uuid-generator.service.ts

import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IUuidGenerationService } from '../../domain/domain-services/i.uuid-generator.interface';

@Injectable()
export class UuidGeneratorService implements IUuidGenerationService {
  
  generateIUserId(): string {
    return randomUUID();
  }
}