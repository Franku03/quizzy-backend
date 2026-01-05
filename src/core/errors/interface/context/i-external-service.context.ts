import { IInfrastructureErrorContext } from "./i-error-infraestructure-context.interface";

export interface IExternalServiceErrorContext extends IInfrastructureErrorContext {
    serviceName: string;
    resourceId?: string;
    provider?: string; 
}