import { Inject, Injectable } from "@nestjs/common";

import type { ActiveSessionContext, IActiveMultiplayerSessionRepository, IPinRepository,  } from "src/multiplayer-sessions/domain/ports";

import type { IdGenerator } from "src/core/application/ports/idgenerator/i-id-generator.interface";
import type { IErrorMapper } from "src/core/errors/interface/mapper/i-error-mapper.interface";
import { UuidGenerator } from "src/core/infrastructure/adapters/idgenerator/uuid-generator";
import { Either, ErrorData } from "src/core/types";
import { IInfrastructureErrorContext } from "src/core/errors/interface/context/i-error-infraestructure-context.interface";
import { InMemoryActiveSessionRepositoryErrorContext, InMemoryActiveSessionRepositoryErrorMapper, REPOSITORY_ERRORS } from '../errors/in-memory-session-respository.error.mapper';
import { FileSystemPinRepository } from "../adapters/file-system.pin.repository";

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
    // Guardamos solo el PIN porque con el PIN ya podemos buscar en activeSessions - Mapa principal: Token -> Datos + Timestamp
    private readonly qrTokens = new Map<qrToken, QrTokenData>();

    // Configuración: Los tokens QR expiran rápido (ej. 10 minutos) - Esto es bueno por seguridad, el QR no debería ser eterno. (TTL -> Time To Live)
    private readonly QR_TTL = 10 * 60 * 1000;

    private readonly errorMapper: IErrorMapper<unknown, IInfrastructureErrorContext> = new InMemoryActiveSessionRepositoryErrorMapper()
    

    constructor(
        @Inject( UuidGenerator )
        private readonly IdGenerator: IdGenerator<string>,
        
        @Inject( FileSystemPinRepository )
        private readonly pinRepository: IPinRepository,
    ) {
        // Limpiador de sesiones no usadas automático cada 10 minutos - cambio a 30 por testeo
        setInterval(() => this.cleanupUnusedSessions(), 30 * 60 * 1000);

        // limpiador de códigos qr cada 5 minutos
        setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
    }

    private getCtx( operation: string, pin?: string, token?: string ): InMemoryActiveSessionRepositoryErrorContext {
        return {
            operation: operation,
            sessionPin: pin,
            token: token,
            adapterName: InMemoryActiveSessionRepository.name,
            portName: 'IActiveMultiplayerSessionRepository',
            module: "multiplayer-sessions"
        }
    }


    async saveSession(sessionWraper: MemorySessionContext): Promise<qrToken> {

        const { session, kahoot, sessionStyling } = sessionWraper;

        // Nota: Recibo ActiveSessionContext, pero guardo MemorySessionContext

        this.activeSessions.set( session.getSessionPin() , {
             session, 
             kahoot,
             sessionStyling,
             lastActivity: Date.now(), // Actualizamos el timestamp de última actividad, se deja el theme en undefined por ahora
        });

        // Generamos el token aleatorio
        const token: qrToken = await this.IdGenerator.generateId()
        
        // Lo guardas mapeado al PIN
        // Guardamos cuándo se creó
        this.qrTokens.set( 
            token, 
            { 
                pin: session.getSessionPin(), 
                createdAt: Date.now() 
            }
        );

        // console.log( this.activeSessions.values() );

        return token;

    }


    async findByPin(pin: string): Promise<MemorySessionContext| null> {
        const result = this.activeSessions.get(pin);
        return result || null;
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

    
    async deleteSession(pin: string): Promise<void> {

        // Al hacer delete, se rompe la referencia fuerte.
        // Si nadie más usa esa Session, el GC la eliminará en la próxima pasada.
        this.activeSessions.delete( pin );

    }

    // Cada vez que se toque la sesión, actualiza lastActivity
    async updateSession( pin: string): Promise<MemorySessionContext | null> {

        const sessionWrapper = await this.findByPin( pin );

        if( !sessionWrapper)
            return null;

        // Actualizamos su estatus de actividad
        sessionWrapper.lastActivity = Date.now();


        return sessionWrapper;

    }


    // =================================================================
    //  MÉTODOS ROP (Wrappers Seguros)
    // =================================================================

    async saveSessionEither(sessionWraper: MemorySessionContext): Promise<Either<ErrorData, string>> {

        const ctx = this.getCtx('saveSession', sessionWraper.session.getSessionPin() );

        try {
            const token = await this.saveSession(sessionWraper);
            return Either.makeRight(token);
        } catch (error) {
            // Si falla el generador de ID o memoria llena (raro), capturamos
            const err = new Error( REPOSITORY_ERRORS.SESSION_NOT_FOUND )
            return Either.makeLeft(this.errorMapper.toErrorData(err,ctx));
        }
    }

    async findByPinEither(pin: string): Promise<Either<ErrorData, MemorySessionContext>> {

        const ctx = this.getCtx('findByPin', pin);
        const session = await this.findByPin(pin);
            
        if (!session) {
            const err = new Error( REPOSITORY_ERRORS.SESSION_NOT_FOUND )
            return Either.makeLeft(this.errorMapper.toErrorData(err,ctx));
        }

        return Either.makeRight(session);

    }

    async findByTemporalTokenEither(token: string): Promise<Either<ErrorData, MemorySessionContext>> {

        const ctx = this.getCtx('findByTemporalToken', undefined, token );
        const session = await this.findByTemporalToken( token );

        if (!session) {
            const err = new Error( REPOSITORY_ERRORS.SESSION_NOT_FOUND )
            return Either.makeLeft(this.errorMapper.toErrorData(err,ctx));
        }

        return Either.makeRight(session);

    }

    async deleteSessionEither(pin: string): Promise<Either<ErrorData, void>> {
        const ctx = this.getCtx('deleteSession', pin );
        try {
            await this.deleteSession(pin);
            return Either.makeRight(undefined); 
        } catch (error) {
            const err = new Error( REPOSITORY_ERRORS.DELETE_FAILED )
            return Either.makeLeft( this.errorMapper.toErrorData( err, ctx ) );
        }
    }


    async updateSessionEither(pin: string): Promise<Either<ErrorData, MemorySessionContext>> {
        
        const ctx = this.getCtx('updateSession', pin );
        const sessionWrapper = await this.updateSession(pin);


        if (!sessionWrapper) {
            const err = new Error( REPOSITORY_ERRORS.SESSION_NOT_FOUND );
            return Either.makeLeft(this.errorMapper.toErrorData(err,ctx));
        }
        
        return Either.makeRight(sessionWrapper); 

    }



    // * Funciones de limpieza de memoria
    private cleanupUnusedSessions() {
        const now = Date.now();
        const MAX_INACTIVITY = 1 * 60 * 60 * 1000; // 1 horas, por ejemplo

        for (const [pin, wrapper] of this.activeSessions.entries()) {

            if (now - wrapper.lastActivity > MAX_INACTIVITY) {
                console.log(`Eliminando sesión inutilizada: ${pin}`);
                // Aquí el GC entra en acción y libera la memoria
                this.activeSessions.delete(pin);
                // Se libera el pin de memoria finalmente
                this.pinRepository.releasePin( pin );

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