/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\adapters\nodecryptoservice\node-crypto.service.ts

import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ICryptoService } from 'src/core/application/ports/crypto/i-crypto.interface';

@Injectable()
export class NodeCryptoService implements ICryptoService {
    calculateSha256(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
}