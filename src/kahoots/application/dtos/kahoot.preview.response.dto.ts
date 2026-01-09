/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\dtos\kahoot.preview.response.dto.ts

export class KahootPreviewResponseDto {
    id: string;
    title: string | null;
    description: string | null;
    coverImageId: string | null; 
    visibility: 'public' | 'private';
    themeId: string;
    author: {
        id: string;
        name: string;
    };
    createdAt: string;
    playCount: number;
    category: string | null;
    status: 'draft' | 'published';
    isInProgress: boolean;
    isCompleted: boolean;
    isFavorite: boolean;
    gameState?: {
        attemptId: string;
        currentScore: number;
        currentSlide: number;
        totalSlides: number;
        lastPlayedAt: string;
    };
}