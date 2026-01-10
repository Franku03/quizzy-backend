/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\queries\get-kahoot-by-id\get-kahoot-by-id.query.ts

import { IQuery } from 'src/core/application/cqrs/query.interface';

interface GetKahootByIdProps {
    kahootId: string;
    userId: string | undefined;
}

export class GetKahootByIdQuery implements IQuery {
    public readonly kahootId: string;
    public readonly userId?: string;
    constructor(props: GetKahootByIdProps) {
        Object.assign(this, props);
    }
}