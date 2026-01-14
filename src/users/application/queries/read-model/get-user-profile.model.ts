import { User } from "src/users/domain/aggregates/user";

export class UserProfileReadModel {
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

    private _originalAvatarId: string | null;

    private constructor(userAggregate: User) {
        this._originalAvatarId = userAggregate.userProfileDetails.avatarAssetId;

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


    static fromDomain(user: User): UserProfileReadModel {
        return new UserProfileReadModel(user);
    }

    
    getMediaAssetIds(): string[] {
        return this._originalAvatarId ? [this._originalAvatarId] : [];
    }

    applyMediaUrls(urlMap: Map<string, string>): void {
        this.user.userProfileDetails.avatarAssetUrl = urlMap.get(this._originalAvatarId!) || null;
    }
}