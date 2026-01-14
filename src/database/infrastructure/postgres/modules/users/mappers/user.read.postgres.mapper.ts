import { UserEntity } from '../../../entities/users.entity';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';

export class UserReadPgMapper {
  
  public static map(entity: UserEntity): UserReadModel {
    let isPremium = false;

    if (entity.subscription) {
        const { state, plan, expiresAt } = entity.subscription;
        
        if (plan === 'MONTHLY_PREMIUM' && state === 'ACTIVE' && expiresAt) {
            const expiresDate = DateISO.createFrom(expiresAt);
            const now = DateISO.generate();
            
            if (expiresDate.isGreaterThan(now)) {
                isPremium = true;
            }
        }
    }

    return new UserReadModel(
        entity.id,
        entity.email,
        entity.username,
        isPremium
    );
  }
}