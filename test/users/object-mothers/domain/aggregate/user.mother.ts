import { User } from 'src/users/domain/aggregates/user';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';
import { UserProfileDetails } from 'src/users/domain/value-objects/user.profile-details';
import { HashedPassword } from 'src/users/domain/value-objects/user.hashed-password';
import { UserType } from 'src/users/domain/value-objects/user.type';
import { UserSubscriptionStatus } from 'src/users/domain/value-objects/user.user-subscription-status';
import { SubscriptionPlan } from 'src/users/domain/value-objects/user.subscription-plan';

export class UserMother {
  
  static createFreeUser(id: string = 'uuid-user-free'): User {
    return User.create(
      new UserId(id),
      new UserEmail('test@quizzy.com'),
      new UserName('TestUser'),
      new UserProfileDetails('Test Name', 'Bio', 'avatar.png'),
      new HashedPassword('hashed_secret'),
      UserType.STUDENT,
      UserSubscriptionStatus.createForPlan(SubscriptionPlan.FREE)
    );
  }

  static createPremiumUser(id: string = 'uuid-user-premium'): User {
    const user = this.createFreeUser(id);
    user.changeSubscription(SubscriptionPlan.MONTHLY_PREMIUM);
    return user;
  }
}