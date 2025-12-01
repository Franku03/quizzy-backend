import { ValueObject } from "src/core/domain/abstractions/value.object";
import { ScoreboardEntry } from "./scoreboard.entry";
import { Player } from "../entity/session.player";
import { PlayerId } from "./player.id";

interface ScoreboardProps {

    entries: ScoreboardEntry[],

}

export class Scoreboard extends ValueObject<ScoreboardProps> {


    constructor( props: ScoreboardProps) {

        super({ ...props });

    }

    // Metodo create
    public static updateScoreboard( players: Player[] ): Scoreboard {
        
        const entries = players
                            .sort((p1,p2) => p1.getScore() - p2.getScore() )
                            .map(( player, index )  => {

                                return ScoreboardEntry.create(
                                    player.id,
                                    player.getPlayerNickname(),
                                    player.getScore(),
                                    index + 1, // Indice luego de haber ordenado nos da el ranking, pero como partimos desde 0 debemos sumar 1
                                )

                            });

        return new Scoreboard( { entries } );
        
    };

    // Hacemos dinamica la obtencion del top a traves de limit
    public getTop(limit: number): ScoreboardEntry[] {
        return this.properties.entries.slice(0, limit);
    }
    
    public getEntryFor(playerId: PlayerId ): ScoreboardEntry {

        const entry = this.properties.entries.find( entry => entry.getPlayerId().equals( playerId ));

        if( !entry )
            throw new Error('El jugador solicitado no se encuentra en el ranking o en la partida')

        return entry;
    }
    
    // TODO: métodos para serializar a JSON para el evento de WebSocket



}