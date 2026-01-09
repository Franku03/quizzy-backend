/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\shared-value-objects\id-objects\image.id.ts

import { Either, ErrorData } from "src/core/types";
import { UuidVO } from "../../abstractions/vo.id";

export class ImageId extends UuidVO {
    public constructor(value: string) {
        super(value); 
    }

    public static create(value: string): Either<ErrorData, ImageId> {
        return UuidVO.check(value, 'ImageId')
            .map(validId => new ImageId(validId));
    }
}