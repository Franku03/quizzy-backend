/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\infrastructure\nest-js\response-dtos\update-user.response.dto.ts

import { User } from "src/users/domain/aggregates/user";

export class UpdateProfileResponseDto {
    user: {
        id: string;
        email: string;
        username: string;
        type: string;
        state: string;
        isPremium: boolean;
        preferences: {
            theme: string;
        };
        userProfileDetails: {
            name: string;
            description: string;
            avatarAssetUrl: string | null;
        };
    };

    private constructor(userAggregate: User) {
        this.user = {
            id: userAggregate.id.value,
            email: userAggregate.email.value,
            username: userAggregate.username.value,
            type: userAggregate.type,
            state: userAggregate.state,
            isPremium: userAggregate.isUserPremium(),
            preferences: {
                theme: userAggregate.userPreferences.themePreference,
            },
            userProfileDetails: {
                name: userAggregate.userProfileDetails.name,
                description: userAggregate.userProfileDetails.description,
                avatarAssetUrl: null 
            }
        };

        Object.defineProperty(this, '_originalAvatarId', {
            value: userAggregate.userProfileDetails.avatarAssetId,
            enumerable: false,
            writable: true
        });
    }

    static fromDomain(user: User): UpdateProfileResponseDto {
        return new UpdateProfileResponseDto(user);
    }
    
    getMediaAssetIds(): string[] {
        const id = (this as any)._originalAvatarId;
        return id ? [id] : [];
    }

    applyMediaUrls(urlMap: Map<string, string>): void {
        const id = (this as any)._originalAvatarId;
        this.user.userProfileDetails.avatarAssetUrl = urlMap.get(id) || null;
    }
}