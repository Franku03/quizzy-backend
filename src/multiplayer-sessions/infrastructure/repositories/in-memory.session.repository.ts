import { Injectable } from "@nestjs/common";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { v4 as uuidv4 } from 'uuid';

type sessionPin = string

type qrToken = string;

interface SessionWrapper { 
    session: MultiplayerSession, 
    kahoot: Kahoot,
    lastActivity: number,
}

interface QrTokenData {
    pin: string;
    createdAt: number; // Timestamp en milisegundos
}


@Injectable()
export class InMemorySessionRepository {
    // * Base de datos en memoria para llevar los agregados asoaciados a cada partida.
    // Al ser un Singleton, este Map vive mientras el servidor este corriendo.
    private readonly activeSessions = new Map<sessionPin, SessionWrapper>();


    // * Mapa: QR Token -> PIN
    // Guardamos solo el PIN porque con el PIN ya podemos buscar en activeSessions
    // Mapa principal: Token -> Datos + Timestamp
    private readonly qrTokens = new Map<qrToken, QrTokenData>();


    // Configuración: Los tokens QR expiran rápido (ej. 10 minutos)
    // Esto es bueno por seguridad, el QR no debería ser eterno.
    private readonly QR_TTL = 10 * 60 * 1000;

    constructor() {
        // Limpiador de sesiones no usadas automático cada 10 minutos
        setInterval(() => this.cleanupUnusedSessions(), 10 * 60 * 1000);

        // limpiador de códigos qr cada 5 minutos
        setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
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

    private cleanupExpiredTokens() {

        const now = Date.now();
        
        for (const [token, data] of this.qrTokens.entries()) {

            if (now - data.createdAt > this.QR_TTL) {
                this.qrTokens.delete(token);
            }

        }

    }

    // Cada vez que toques la sesión, actualiza lastActivity
    async save(sessionWraper: SessionWrapper): Promise<qrToken> {

        // ? Para mejorar rendimiento podemos hacer que si un kahoot ya se encuentra registrado, simplemente tomemos la referencia de uno ya existente y asociemos ese al sessionWrapper
        const { session, kahoot } = sessionWraper;

        this.activeSessions.set( session.getSessionPin().getPin() , {
             session, 
             kahoot,
             lastActivity: Date.now()
        });

        // Generas un token aleatorio (puedes usar crypto.randomUUID())
        const token: qrToken = uuidv4();
        
        // Lo guardas mapeado al PIN
        // Guardamos cuándo se creó
        this.qrTokens.set( 
            token, 
            { 
                pin: session.getSessionPin().getPin(), 
                createdAt: Date.now() 
            }
        );
        
        // (Opcional) Guardas el token dentro de la sesión por si necesitas borrarlo
        // session.setQrToken(token);

        console.log( this.activeSessions.values() );

        return token;
    }

    async findByPin(pin: string): Promise<SessionWrapper| null> {
        return this.activeSessions.get( pin ) || null;
    }
    
    async delete(pin: string): Promise<void> {
        this.activeSessions.delete( pin );
        // Al hacer delete, se rompe la referencia fuerte.
        // Si nadie más usa esa Session, el GC la eliminará en la próxima pasada.
    }

    async findSessionByQrToken(token: string): Promise<SessionWrapper | null> {

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
}  