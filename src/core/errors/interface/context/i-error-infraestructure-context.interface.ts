import { IErrorContext } from "./i-error-context.interface";

export interface IInfrastructureErrorContext extends IErrorContext {
    adapterName: string;
    portName: string;
    module?: string;
}