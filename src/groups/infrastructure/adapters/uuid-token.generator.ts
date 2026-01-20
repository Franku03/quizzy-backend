/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\infrastructure\adapters\uuid-token.generator.ts

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ITokenGenerator } from '../../domain/domain-services/i.token-generator.service.interface';

@Injectable()
export class UuidTokenGenerator implements ITokenGenerator {
    generate(): string {
        return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
    }
}