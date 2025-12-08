import { IInfrastructureErrorContext } from "./i-error-infraestructure-context.interface";

export interface IDatabaseErrorContext extends IInfrastructureErrorContext {
    databaseType: 'mongodb' | 'postgresql';
    collectionOrTable?: string;
    entityId?: string;
}
