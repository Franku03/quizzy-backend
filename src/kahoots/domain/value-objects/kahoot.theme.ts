/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\value-objects\kahoot.theme.ts

import { Either, ErrorData } from "src/core/types";
import { UuidVO } from "src/core/domain/abstractions/vo.id";

export class ThemeId extends UuidVO {
    public constructor(value: string) {
        super(value);
    }

    public static create(value: string): Either<ErrorData, ThemeId> {
        // Si el check pasa, hacemos el new. Si no, devolvemos el error. 
        return UuidVO.check(value, 'ThemeId')
            .map(validId => new ThemeId(validId));
    }
}