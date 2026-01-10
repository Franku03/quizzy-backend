/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\media\application\ports\i-asset-storage.interface.ts

import { Either, ErrorData } from 'src/core/types';

export interface IAssetStorageService {
    upload(
        fileBuffer: Buffer,
        mimeType: string,
        originalName: string,
        publicId: string
    ): Promise<Either<ErrorData, {
        publicId: string;
        provider: string;
        mimeType: string;
        format: string;
        size: number;
    }>>;

    delete(
        publicId: string,
        provider: string
    ): Promise<Either<ErrorData, void>>;
}