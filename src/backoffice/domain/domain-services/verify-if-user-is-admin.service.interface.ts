import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { Either, ErrorData } from 'src/core/types';

export interface IVerifyIfUserIsAdminService {
  execute(userId: UserId): Promise<Either<ErrorData, boolean>>;
}
