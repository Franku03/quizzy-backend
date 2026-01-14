import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../../entities/users.entity';
import { UserReadModel } from 'src/users/application/queries/read-model/user.read.model';
import { DateISO } from 'src/core/domain/shared-value-objects/value-objects/value.object.date';

@Injectable()
export class UserReadPgMapper {
  
  map(entity: UserEntity): UserReadModel {

    let isPremium = false;

    if (entity.subscription) {
        const { plan, state, expiresAt } = entity.subscription;
        
        const expiresDate = DateISO.createFrom(expiresAt);
        const now = DateISO.generate();

        if (plan === 'MONTHLY_PREMIUM' && 
            state === 'ACTIVE' && expiresDate.isGreaterThan(now)) {
            isPremium = true;
        }
    }

    const readModel: any = { 
        id: entity.id,
        email: entity.email,
        username: entity.username,
        type: entity.type,
        state: entity.state,
        isPremium: isPremium,
        userProfileDetails: {
            name: entity.profileName,
            description: entity.profileDescription,
            avatarAssetUrl: null
        }
    };

    Object.defineProperty(readModel, '_originalAvatarId', {
        value: entity.avatarAssetId,
        enumerable: false,
        writable: true
    });

    readModel.getMediaAssetIds = () => readModel._originalAvatarId ? [readModel._originalAvatarId] : [];
    readModel.applyMediaUrls = (urlMap: Map<string, string>) => {
        readModel.userProfileDetails.avatarAssetUrl = urlMap.get(readModel._originalAvatarId!) || null;
    };

    return readModel as UserReadModel;
  }
}