/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\infrastructure\adapters\idgenerator\uuid-generator.ts

import { Injectable } from '@nestjs/common'
import { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class UuidGenerator implements IdGenerator<string> {
    generateId(): string {
        return uuidv4()
    }
}