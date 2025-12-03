import { Injectable } from "@nestjs/common";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";

type sessionPin = string

interface SessionWrapper { 
    session: MultiplayerSession, 
    kahoot: Kahoot,
    lastActivity: number,
}

@Injectable()
export class InMemorySessionRepository {
    // Base de datos en memoria para llevar los agregados asoaciados a cada partida.
    // Al ser un Singleton, este Map vive mientras el servidor este corriendo.
    private readonly activeSessions = new Map<sessionPin, SessionWrapper>();

    constructor() {
        // Limpiador automático cada 10 minutos
        setInterval(() => this.cleanupUnusedSessions(), 10 * 60 * 1000);
    }

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

    // Cada vez que toques la sesión, actualiza lastActivity
    async save(sessionWraper: SessionWrapper): Promise<void> {

        // ? Para mejorar rendimiento podemos hacer que si un kahoot ya se encuentra registrado, simplemente tomemos la referencia de uno ya existente y asociemos ese al sessionWrapper
        const { session, kahoot } = sessionWraper;

        this.activeSessions.set( session.getSessionPin().getPin() , {
             session, 
             kahoot,
             lastActivity: Date.now()
        });

        console.log( this.activeSessions.values() );
    }

    async findByPin(pin: string): Promise<SessionWrapper| null> {
        return this.activeSessions.get( pin ) || null;
    }
    
    async delete(pin: string): Promise<void> {
        this.activeSessions.delete( pin );
        // Al hacer delete, se rompe la referencia fuerte.
        // Si nadie más usa esa Session, el GC la eliminará en la próxima pasada.
    }
}  