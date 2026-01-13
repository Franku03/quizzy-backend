
export interface SessionConcurrencyManager {

    /**
     * Ejecuta una tarea de forma exclusiva para un PIN específico.
     * Si llega otra petición con el mismo PIN, esperará en fila hasta que esta termine.
     */
    runInSequence<T>(sessionPin: string, task: () => Promise<T>): Promise<T>;
    
    /**
     * Limpieza de locks cuando la partida termina (para no llenar la RAM)
     * 
     */
    releaseLockResource(sessionPin: string);
    
}