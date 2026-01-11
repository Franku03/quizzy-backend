import { IHasMediaAssets } from 'src/core/domain/abstractions/media.assets.interface';

export class UserProfileReadModel {

    public avatarUrl?: string;

    constructor(
      public readonly id: string,
      public readonly email: string,
      public readonly username: string,
      public readonly type: string,
      public readonly state: string,
      public readonly roles: string[],
      public readonly isAdmin: boolean,
      public readonly preferences: {
        theme: string;
      },
      public readonly userProfileDetails: {
        name: string;
        description: string;
        avatarAssetUrl: string | '';
      },
      public readonly isPremium: boolean
      // Si se quiere agregar suscripción en el futuro, iría aquí
      // public readonly subscription: ...
    ) {}

    getMediaAssetIds(): string[] {
      if (this.userProfileDetails.avatarAssetUrl) {
          return [this.userProfileDetails.avatarAssetUrl];
      }
      return [];
    }

    applyMediaUrls(urlMap: Map<string, string>): void {
      if (this.userProfileDetails.avatarAssetUrl) {
          const url = urlMap.get(this.userProfileDetails.avatarAssetUrl);
          if (url) {
              this.avatarUrl = url;
          }
      }
    }
  }