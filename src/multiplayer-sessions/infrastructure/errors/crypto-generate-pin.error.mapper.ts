import { IInfrastructureErrorContext } from 'src/core/errors/interface/context/i-error-infraestructure-context.interface';
import { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { ErrorData, ErrorLayer } from 'src/core/types';

export class CryptoGeneratePinServiceErrorMapper implements IErrorMapper<unknown, IInfrastructureErrorContext> {

    public toErrorData(error: unknown, context: IInfrastructureErrorContext): ErrorData {

        const baseDetails = context; 

        const message = error instanceof Error ? error.message : 'Unknown infrastructure error.';
        const safeError = error instanceof Error ? error : undefined;
        
        return new ErrorData(
            "PIN_GENERATION_FAILED",
            message,
            ErrorLayer.INFRASTRUCTURE,
            baseDetails, 
            safeError 
        );

    }




}