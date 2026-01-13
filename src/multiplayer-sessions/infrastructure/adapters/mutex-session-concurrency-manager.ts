
import { Injectable } from '@nestjs/common';
import { Mutex, MutexInterface } from 'async-mutex';
import { SessionConcurrencyManager } from 'src/multiplayer-sessions/application/ports/i-session-concurrency-manager.interface';

@Injectable()
export class MutexSessionConcurrencyManager implements SessionConcurrencyManager {

    // Un mapa que guarda un semáforo por cada PIN de sesión activa
    private readonly locks = new Map<string, MutexInterface>();

    /**
     * Ejecuta una tarea de forma exclusiva para un PIN específico.
     * Si llega otra petición con el mismo PIN, esperará en fila hasta que esta termine.
     */
    async runInSequence<T>(sessionPin: string, task: () => Promise<T>): Promise<T> {

        if (!this.locks.has(sessionPin)) {
            this.locks.set(sessionPin, new Mutex());
        }

        const mutex = this.locks.get(sessionPin)!;

        // runExclusive adquiere el bloqueo, ejecuta la tarea y lo libera automáticamente (incluso si falla)
        return mutex.runExclusive(task);
        
    }
    
    // Opcional: Limpieza de locks cuando la partida termina (para no llenar la RAM)
    releaseLockResource(sessionPin: string) {
        this.locks.delete(sessionPin);
    }
}