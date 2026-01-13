
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { E_TIMEOUT, Mutex, MutexInterface, withTimeout } from 'async-mutex';
import { ISessionConcurrencyManager } from 'src/multiplayer-sessions/application/ports/i-session-concurrency-manager.interface';

@Injectable()
export class MutexSessionConcurrencyManager implements ISessionConcurrencyManager {

    private readonly logger: Logger = new Logger('MutexConcurrencyManager');
    
    // Un mapa que guarda un semáforo por cada PIN de sesión activa
    private readonly locks = new Map<string, MutexInterface>();

    // Configuración: Si una operación tarda más de 5 segundos, asumimos error y soltamos.
    private readonly OPERATION_TIMEOUT_MS = 5000;

    /**
     * Ejecuta una tarea de forma exclusiva para un PIN específico.
     * Si llega otra petición con el mismo PIN, esperará en fila hasta que esta termine.
     */
    async runInSequence<T>(sessionPin: string, task: () => Promise<T>): Promise<T> {

        // 1) obtenemos la operación del mutex y bloqueamos para evitar condiciones de carrera
        if (!this.locks.has(sessionPin)) {
            this.locks.set(sessionPin, new Mutex());
        }

        const mutex = this.locks.get(sessionPin)!;


        // 2) Envolver el mutex con un Timeout
        // Esto asegura que si 'task' se queda colgada, el mutex se libere lanzando error.
        // runExclusive adquiere el bloqueo, ejecuta la tarea y lo libera automáticamente (incluso si falla)
        const mutexWithTimeout = withTimeout(mutex, this.OPERATION_TIMEOUT_MS);

        try {
            return await mutexWithTimeout.runExclusive(task);
        } catch (error) {
            if (error === E_TIMEOUT) {
                // Loguear esto es vital: significa que algo en tu lógica es muy lento
                this.logger.error(`Timeout lock for Session with PIN: ${sessionPin}`);
                throw new InternalServerErrorException("Server busy: processing took too long.");
            }
            throw error;
        }

    }
    
    /**
     * 
     * Evita fugas de memoria (Memory Leaks).
     */
    deleteSessionLock(sessionPin: string): void {
        if (this.locks.has(sessionPin)) {
            // Opcional: Podrías verificar si está bloqueado, pero generalmente
            // si borras la sesión, quieres destruir el candado inmediatamente.
            this.locks.delete(sessionPin);
            this.logger.debug(`Lock resources released for Session with PIN: ${sessionPin}`);
        }
    }
}