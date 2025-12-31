// application/authorization/strategies/AttemptOwnershipAuthorizer.ts

import { IAuthorizer } from '../authorizer.interface';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';
import { ISoloAttemptQueryDao } from 'src/solo-attempts/application/queries/ports/attempts.dao.port';

// Any Command or Query that has these two fields is welcome here.
export interface IRequestWithIds {
  attemptId: string;
  userId: string; 
}

export class AttemptOwnershipAuthorizer implements IAuthorizer<IRequestWithIds, ISoloAttemptQueryDao> {
  
  async authorize(request: IRequestWithIds, context: ISoloAttemptQueryDao): Promise<void> {
    // Extract attemptId and userId from the request
    const attemptId = request.attemptId;
    const userId = request.userId;
    
    // Use the context (which is the DAO) to fetch the userID corresponding to the attempt
    // This is an O(1) operation, the DAO uses indexed lookup for efficiency
    const attemptPlayerIdOptional = await context.getAttemptUserId(attemptId);
    
    if (!attemptPlayerIdOptional.hasValue()) {
       // We return a domain error if the attempt is not found.
       // Infrastructure layer will handle it accordingly.
       throw new Error(ATTEMPT_ERROR_CODES.ATTEMPT_NOT_FOUND); 
    }

    const attemptPlayerId = attemptPlayerIdOptional.getValue();

    // Check if the attempt's playerId matches the userId from the command
    if (attemptPlayerId !== userId) {
        // If they don't match, throw an unauthorized error
       throw new Error(ATTEMPT_ERROR_CODES.UNAUTHORIZED_ATTEMPT_ACCESS);
    }
  }
}