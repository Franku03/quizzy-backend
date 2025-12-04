import { User } from 'src/users/domain/aggregates/user';
import { UserMongo } from 'src/database/infrastructure/mongo/entities/users.schema';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { UserProfileDetails } from 'src/users/domain/value-objects/user.profile-details';
import { HashedPassword } from 'src/users/domain/value-objects/user.hashed-password';
import { UserPreferences, UIThemeEnum } from 'src/users/domain/value-objects/user.user-preferences';
import { UserType } from 'src/users/domain/value-objects/user.type';
import { UserSubscriptionStatus } from 'src/users/domain/value-objects/user.user-subscription-status';
import { SubscriptionState } from 'src/users/domain/value-objects/user.subscription-state';
import { SubscriptionPlan } from 'src/users/domain/value-objects/user.subscription-plan';
import { UserFavorites } from 'src/users/domain/value-objects/user.favorite-kahoots';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';

export class UserMapper {

  static toDomain(raw: UserMongo): User {
    const id = new UserId(raw.userId);
    const email = new UserEmail(raw.email);
    const username = new UserName(raw.username);
    
    const passwordHash = new HashedPassword(raw.passwordHash);
    
    const type = raw.type as UserType; 

    const profile = new UserProfileDetails(
      raw.profile.name,
      raw.profile.description,
      raw.profile.avatarUrl
    );

    const subscriptionExpiresIso = new Date(raw.subscription.expiresAt).toISOString().split('T')[0];
    
    const subscription = new UserSubscriptionStatus(
      raw.subscription.state as SubscriptionState,
      raw.subscription.plan as SubscriptionPlan,
      DateISO.createFrom(subscriptionExpiresIso)
    );

    const preferences = UserPreferences.create(raw.preferences.theme); 

    let lastUsernameUpdate: DateISO | undefined = undefined;
    if (raw.lastUsernameUpdate) {
        const updateIso = new Date(raw.lastUsernameUpdate).toISOString().split('T')[0];
        lastUsernameUpdate = DateISO.createFrom(updateIso);
    }

    const favorites = UserFavorites.fromPrimitives(raw.favoriteKahoots || []);

    return new User(
      {
        email,
        username,
        userProfileDetails: profile,
        passwordHash,
        type,
        subscriptionStatus: subscription,
        userPreferences: preferences,
        lastUsernameUpdate,
        favorites,
      },
      id
    );
  }

  static toPersistence(user: User): UserMongo {
    return {
      userId: user.id.value,
      email: user.email.value,
      username: user.username.value,
      passwordHash: user.passwordHash.value,
      type: user.type,

      lastUsernameUpdate: user.lastUsernameUpdate 
        ? new Date(user.lastUsernameUpdate.value) 
        : undefined,

      profile: {
        name: user.userProfileDetails.name,
        description: user.userProfileDetails.description,
        avatarUrl: user.userProfileDetails.avatarImageURL,
      },

      subscription: {
        state: user.subscriptionStatus.state,
        plan: user.subscriptionStatus.plan,
        expiresAt: new Date(user.subscriptionStatus.expiresAt.value),
      },

      preferences: {
        theme: user.userPreferences.themePreference,
      },

      favoriteKahoots: user.favorites.toPrimitives(),
    } as UserMongo;
  }
}