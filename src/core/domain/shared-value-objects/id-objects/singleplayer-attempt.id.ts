/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\shared-value-objects\id-objects\singleplayer-attempt.id.ts

import { UuidVO } from "../../abstractions/vo.id";

export class AttemptId extends UuidVO {
    public constructor(id: string) {
        super(id);
    } 
}