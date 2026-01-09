import { IInfrastructureErrorContext } from 'src/core/errors/interface/context/i-error-infraestructure-context.interface';
import { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { ErrorData, ErrorLayer } from 'src/core/types';

export interface InMemoryActiveSessionRepositoryErrorContext extends IInfrastructureErrorContext {

    operation: string,
    sessionPin?: string,
    token?: string,

}

export const REPOSITORY_ERRORS = {
    SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
    SAVE_FAILED: 'SAVE_FAILED',
    DELETE_FAILED: 'DELETE_FAILED'
};

export class InMemoryActiveSessionRepositoryErrorMapper implements IErrorMapper<unknown, InMemoryActiveSessionRepositoryErrorContext> {

    public toErrorData(error: unknown, context: IInfrastructureErrorContext): ErrorData {

        const baseDetails = context; 

        const message = error instanceof Error ? error.message : 'Unknown infrastructure error.';
        const safeError = error instanceof Error ? error : undefined;
        
        return new ErrorData(
            "FAILED_OPERATION_AT_MULTIPLAYER_SESSION_MEMORY_REPOSITORY",
            message,
            ErrorLayer.INFRASTRUCTURE,
            baseDetails, 
            safeError 
        );

    }




}