import { UserEntity } from '../../../entities/users.entity';
import { User } from 'src/users/domain/aggregates/user';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { UserProfileDetails } from 'src/users/domain/value-objects/user.profile-details';
import { HashedPassword } from 'src/users/domain/value-objects/user.hashed-password';
import { UserPreferences } from 'src/users/domain/value-objects/user.user-preferences';
import { UserType } from 'src/users/domain/value-objects/user.type';
import { UserSubscriptionStatus } from 'src/users/domain/value-objects/user.user-subscription-status';
import { SubscriptionState } from 'src/users/domain/value-objects/user.subscription-state';
import { SubscriptionPlan } from 'src/users/domain/value-objects/user.subscription-plan';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';
import { UserFavorites } from 'src/users/domain/value-objects/user.favorite-kahoots';
import { UserState } from 'src/users/domain/value-objects/user.state';
import { UserRole } from 'src/users/domain/value-objects/user.roles';

export class UserPersistencePgMapper {
  
  static toDomain(entity: UserEntity): User {
    const id = new UserId(entity.id);
    const email = new UserEmail(entity.email);
    const username = new UserName(entity.username);
    const passwordHash = new HashedPassword(entity.passwordHash);
    const type = entity.type as UserType;

    const profile = new UserProfileDetails(
      entity.profileName,
      entity.profileDescription || '',
      entity.avatarAssetId || '',
    );

    const subscriptionExpiresIso = new Date(entity.subscription.expiresAt)
      .toISOString()
      .split('T')[0];

    const subscription = new UserSubscriptionStatus(
      entity.subscription.state as SubscriptionState,
      entity.subscription.plan as SubscriptionPlan,
      DateISO.createFrom(subscriptionExpiresIso),
    );

    const preferences = UserPreferences.create(entity.preferences.theme);

    let lastUsernameUpdate: DateISO | undefined = undefined;
    if (entity.lastUsernameUpdate) {
      lastUsernameUpdate = DateISO.createFrom(entity.lastUsernameUpdate);
    }

    const favorites = UserFavorites.fromPrimitives(entity.favorites || []);

    return User.reconstitute(
      {
        email,
        username,
        userProfileDetails: profile,
        passwordHash,
        userPreferences: preferences,
        type,
        subscriptionStatus: subscription,
        lastUsernameUpdate,
        favorites,
        state: entity.state as UserState,
        roles: entity.roles as UserRole[],
        isDeleted: entity.isDeleted,
        deletedHash: entity.deletedHash || null,
      },
      id,
    );
  }

  static toPersistence(domain: User): UserEntity {
    const entity = new UserEntity();
    
    entity.id = domain.id.value;
    entity.email = domain.email.value;
    entity.username = domain.username.value;
    entity.passwordHash = domain.passwordHash.value;
    
    entity.profileName = domain.userProfileDetails.name;
    entity.profileDescription = domain.userProfileDetails.description;
    entity.avatarAssetId = domain.userProfileDetails.avatarAssetId;

    entity.type = domain.type;
    entity.state = domain.state;
    entity.isDeleted = domain.isDeleted;
    entity.deletedHash = domain.deletedHash;

    entity.subscription = {
        state: domain.subscriptionStatus.state,
        plan: domain.subscriptionStatus.plan,
        expiresAt: domain.subscriptionStatus.expiresAt.value,
    };

    entity.preferences = {
        theme: domain.userPreferences.themePreference,
    };

    entity.roles = domain.roles;
    entity.favorites = domain.favorites.toPrimitives();

    entity.lastUsernameUpdate = domain.lastUsernameUpdate 
        ? domain.lastUsernameUpdate.value 
        : null;

    return entity;
  }
}