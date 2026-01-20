
// Interfaz necesaria para lograr capa de acoplamiento abstracto con cual sea la herramienta que se utilice para manejar las condiciones
// de carrera generadas por el await en una WS API
export interface ISessionConcurrencyManager {

    /**
     * Ejecuta una tarea de forma exclusiva para un PIN específico.
     * Si llega otra petición con el mismo PIN, esperará en fila hasta que esta termine.
     */
    runInSequence<T>(sessionPin: string, task: () => Promise<T>): Promise<T>;
    
    /**
     * Limpieza de locks cuando la partida termina (para no llenar la RAM)
     * 
     */
    deleteSessionLock(sessionPin: string): void
    
}