export interface IErrorContext {
    operation?: string;      // Operación que falló
    actorId?: string;
    [key: string]: any;     // Extensible para contextos específicos 
}