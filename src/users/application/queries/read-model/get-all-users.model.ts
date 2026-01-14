import { User } from "src/users/domain/aggregates/user";

export class GetAllUsersModel {
    id: string;
    email: string;
    username: string;
    type: string;
    state: string;
    userProfileDetails: {
        name: string;
        description: string;
        avatarAssetUrl: string | null;
    };
    isPremium: boolean;

    private _originalAvatarId: string | null;

    private constructor(user: User) {
        this.id = user.id.value;
        this.email = user.email.value;
        this.username = user.username.value;
        this.type = user.type;
        this.state = user.state;
        this.isPremium = user.isUserPremium();

        this.userProfileDetails = {
            name: user.userProfileDetails.name,
            description: user.userProfileDetails.description,
            avatarAssetUrl: null
        };

        Object.defineProperty(this, '_originalAvatarId', {
            value: user.userProfileDetails.avatarAssetId,
            enumerable: false, 
            writable: true
        });
    }

    static fromDomain(user: User): GetAllUsersModel {
        return new GetAllUsersModel(user);
    }
    
    getMediaAssetIds(): string[] {
        return this._originalAvatarId ? [this._originalAvatarId] : [];
    }

    applyMediaUrls(urlMap: Map<string, string>): void {
        this.userProfileDetails.avatarAssetUrl = urlMap.get(this._originalAvatarId!) || null;
    }
}