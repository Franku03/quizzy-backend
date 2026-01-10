import { IAuthorizer } from '../authorizer.interface';
import { ErrorData, ErrorLayer } from 'src/core/types';
import { IUserRepository } from 'src/users/domain/ports/IUserRepository';

export interface IUserOwnershipRequest {
  userId: string;
  targetUserId: string;
}

export class UserOwnershipAuthorizer implements IAuthorizer<IUserOwnershipRequest, IUserRepository> {
  async authorize(command: IUserOwnershipRequest, context: IUserRepository): Promise<void> {
    if (command.userId !== command.targetUserId) {
      throw new Error("Unauthorized: You can only modify your own profile.");
    }
  }
}