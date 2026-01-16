/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\queries\read-model\get-public-profile.model.ts

import { User } from "src/users/domain/aggregates/user";

export class PublicUserProfileReadModel {
    user: {
        id: string;
        email: string;
        username: string;
        type: string;
        state: string;
        isPremium: boolean;
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

    static fromDomain(user: User): PublicUserProfileReadModel {
        return new PublicUserProfileReadModel(user);
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