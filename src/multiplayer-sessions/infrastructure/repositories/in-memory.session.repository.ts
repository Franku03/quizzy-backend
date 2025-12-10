import { Inject, Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid';
import { FileSystemPinRepository } from "../adapters/file-system.pin.repository";

import type { ActiveSessionContext, IActiveMultiplayerSessionRepository, IPinRepository,  } from "src/multiplayer-sessions/domain/ports";

import type { IdGenerator } from "src/core/application/idgenerator/id.generator";
import { UuidGenerator } from "src/core/infrastructure/adapters/idgenerator/uuid-generator";

type sessionPin = string

type qrToken = string;

interface MemorySessionContext extends ActiveSessionContext { 

    lastActivity: number,

}

interface QrTokenData {
    pin: string;
    createdAt: number; // Timestamp en milisegundos
}


@Injectable()
export class InMemoryActiveSessionRepository implements IActiveMultiplayerSessionRepository {

    // ! Nueva estructura para manejar la cola de promesas (Bloqueo Asíncrono) - Se dejara para futuras iteraciones
    // private readonly locks = new Map<sessionPin, Promise<any>>(); 

    // * Base de datos en memoria para llevar los agregados asoaciados a cada partida.
    // Al ser un Singleton, este Map vive mientras el servidor este corriendo.
    private readonly activeSessions = new Map<sessionPin, MemorySessionContext>();


    // * Mapa: QR Token -> PIN
    // Guardamos solo el PIN porque con el PIN ya podemos buscar en activeSessions
    // Mapa principal: Token -> Datos + Timestamp
    private readonly qrTokens = new Map<qrToken, QrTokenData>();


    // Configuración: Los tokens QR expiran rápido (ej. 10 minutos)
    // Esto es bueno por seguridad, el QR no debería ser eterno. (TTL -> Time To Live)
    private readonly QR_TTL = 10 * 60 * 1000;

    constructor(
        @Inject( FileSystemPinRepository )
        private readonly pinRepo: IPinRepository,

        @Inject( UuidGenerator )
        private readonly IdGenerator: IdGenerator<string>,
    ) {
        // Limpiador de sesiones no usadas automático cada 10 minutos
        setInterval(() => this.cleanupUnusedSessions(), 10 * 60 * 1000);

        // limpiador de códigos qr cada 5 minutos
        setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
    }



    // Cada vez que se toque la sesión, actualiza lastActivity
    async saveSession(sessionWraper: MemorySessionContext): Promise<qrToken> {

        // ? Para mejorar rendimiento podemos hacer que si un kahoot ya se encuentra registrado, simplemente tomemos la referencia de uno ya existente y asociemos ese al MemorySessionContext
        const { session, kahoot } = sessionWraper;

        this.activeSessions.set( session.getSessionPin().getPin() , {
             session, 
             kahoot,
             lastActivity: Date.now() // Actualizamos el timestamp de última actividad
        });

        // Generas un token aleatorio (puedes usar crypto.randomUUID())
        const token: qrToken = await this.IdGenerator.generateId()
        
        // Lo guardas mapeado al PIN
        // Guardamos cuándo se creó
        this.qrTokens.set( 
            token, 
            { 
                pin: session.getSessionPin().getPin(), 
                createdAt: Date.now() 
            }
        );

        console.log( this.activeSessions.values() );

        return token;

    }

    async findByPin(pin: string): Promise<MemorySessionContext| null> {
        return this.activeSessions.get( pin ) || null;
    }

    // Buscamos en este caso por qrToken
    async findByTemporalToken(token: string): Promise<MemorySessionContext | null> {

        const data = this.qrTokens.get(token);
        
        if ( !data ) 
            return null;

        // Si existe pero ya expiró (y el setInterval no ha pasado aún), lo borramos ahora
        if (Date.now() - data.createdAt > this.QR_TTL) {
            this.qrTokens.delete(token);
            return null;
        }

        return this.findByPin( data.pin );
    }

    
    async delete(pin: string): Promise<void> {

        // Al hacer delete, se rompe la referencia fuerte.
        // Si nadie más usa esa Session, el GC la eliminará en la próxima pasada.
        this.activeSessions.delete( pin );

        // Eliminamos el pin del txt para liberarlo
        this.pinRepo.releasePin( pin );

    }

    // TODO: Implementar metodo para chequear existencia de la partida y si el usuario es propietario
    async IsUserSessionHost( pin: string, userId: string ): Promise<boolean> {

        const session = this.activeSessions.get( pin );

        if( !session )
            return false

        return true

    }


    // ! Funciones de limpieza de memoria
    private cleanupUnusedSessions() {
        const now = Date.now();
        const MAX_INACTIVITY = 1 * 60 * 60 * 1000; // 1 horas, por ejemplo

        for (const [pin, wrapper] of this.activeSessions.entries()) {

            if (now - wrapper.lastActivity > MAX_INACTIVITY) {
                console.log(`Eliminando sesión inutilizada: ${pin}`);
                this.activeSessions.delete(pin);
                // Aquí el GC entra en acción y libera la memoria
                // Recordar llamar aqui al servicio de borrado del pin del txt
            }

        }
    }

    private cleanupExpiredTokens() {

        const now = Date.now();
        
        for (const [token, data] of this.qrTokens.entries()) {

            if (now - data.createdAt > this.QR_TTL) {
                this.qrTokens.delete(token);
            }

        }

    }

    // ! Dado que todo aqui es asincrono debemos bloquear recursos por la concurrencia, se dejara para una siquiente iteracion
    /**
     * Aplica un bloqueo asíncrono a una sesión (PIN) para que las operaciones
     * críticas sobre ese agregado se ejecuten secuencialmente.
     */
    // private async applyLock<T>(pin: string, operation: () => Promise<T>): Promise<T> {
        
    //     // 1. Obtener la última promesa activa para este PIN (o una promesa resuelta si no hay bloqueo)
    //     const currentLock = this.locks.get(pin) || Promise.resolve();
        
    //     // 2. Encadenar la nueva operación a la última promesa activa.
    //     // Se asegura que la nueva operación no empieza hasta que la anterior termina.
    //     const newLock = currentLock.then(async () => {
    //         // Se ejecuta la lógica de negocio (operación)
    //         const result = await operation();
    //         return result;
    //     }).finally(() => {
    //         // 3. Cuando la operación actual termina, si no hay más operaciones encadenadas
    //         // removemos el lock para liberar el PIN (solo si es la última).
    //         // NOTA: Con .then() y .finally() esto se maneja implícitamente en la cadena, 
    //         // pero para evitar que el Map crezca eternamente, debes limpiar al final.
    //         // Para simplicidad, Socket.IO + Node.js garantiza la secuencialidad
    //         // con un simple encadenamiento.
    //         // Más robusto: usar una librería de "async-lock" si es necesario.
            
    //         // Para esta implementación simple, simplemente resolvemos la cadena:
    //         return pin; // Devolvemos el pin para que la siguiente operación sepa a quién seguir
    //     });

    //     // 4. Actualizar el Map con la nueva promesa (el final de la cadena)
    //     this.locks.set(pin, newLock);
        
    //     // 5. Esperar el resultado final de la operación actual
    //     return newLock.then(result => result); // Retorna el resultado de la operación
    // }
    
}  