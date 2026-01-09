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