import { User } from "src/users/domain/aggregates/user";

export class RegisterUserResponseDto {
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
            preferences: {
                theme: userAggregate.userPreferences.themePreference,
            },
            userProfileDetails: {
                name: userAggregate.userProfileDetails.name,
                description: userAggregate.userProfileDetails.description,
                avatarAssetUrl: null 
            },
            isPremium: userAggregate.isUserPremium(),
        };

        Object.defineProperty(this, '_originalAvatarId', {
            value: userAggregate.userProfileDetails.avatarAssetId,
            enumerable: false, 
            writable: true
        });
    }

    static fromDomain(user: User): RegisterUserResponseDto {
        return new RegisterUserResponseDto(user);
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