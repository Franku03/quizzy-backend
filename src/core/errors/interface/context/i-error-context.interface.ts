export interface IErrorContext {
    operation: string;      // Operación que falló
    [key: string]: any;     // Extensible para contextos específicos
}