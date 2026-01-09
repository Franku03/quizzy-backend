/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\shared-value-objects\id-objects\kahoot.id.ts

import { Either, ErrorData } from "src/core/types";
import { UuidVO } from "../../abstractions/vo.id";

export class KahootId extends UuidVO {
    public constructor(id: string) {
        super(id); 
    }

    public static create(value: string): Either<ErrorData, KahootId> {
        return UuidVO.check(value, 'KahootId')
            .map(validId => new KahootId(validId));
    }
}