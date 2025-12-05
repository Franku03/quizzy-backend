import { ValueObject } from "src/core/domain/abstractions/value.object";
import { ScoreboardEntry } from "./scoreboard.entry";
import { Player } from "../entity/session.player";
import { PlayerId } from "./player.id";

interface ScoreboardProps {

    entries: ScoreboardEntry[],

}

export class Scoreboard extends ValueObject<ScoreboardProps> {


    public constructor( props: ScoreboardProps) {

        super({ ...props });

    }

    // Para crear el objeto vacio al inicio de la partida
    public static create(): Scoreboard {

        return new Scoreboard({ entries: [] });

    }

    public updateScoreboard( players: Player[] ): Scoreboard {

        const previousRanks = this.properties.entries.map( entry =>({ id: entry.getPlayerId().value, previousRank: entry.getRank() }));
        
        const entries = players
                            .sort((p1,p2) => p2.getScore() - p1.getScore()  ) // orden descendente
                            .map(( player, index )  => {

                                let oldRank: number = 0;

                                for( const rank of previousRanks ){

                                    if( rank.id === player.id.value )
                                        oldRank = rank.previousRank;

                                }

                                return ScoreboardEntry.create(
                                    player.id,
                                    player.getPlayerNickname(),
                                    player.getScore(),
                                    index + 1, // Indice luego de haber ordenado nos da el ranking, pero como partimos desde 0 debemos sumar 1
                                    oldRank
                                )

                            });

        return new Scoreboard( { entries } );
        
    };

    // Para el inicio de la partida
    public addScoreboardEntry( player: Player ): Scoreboard {

        const playerEntries: ScoreboardEntry[] = [];

        playerEntries.push( ScoreboardEntry.create(
                                    player.id,
                                    player.getPlayerNickname(),
                                    player.getScore(),
                                    1,
                                    1 // su ranking anterior por defecto es 1
                            ));

        return new Scoreboard( { entries: playerEntries } );
        
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

    public getEntries(): ScoreboardEntry[] {
        return this.properties.entries;
    }
    
    // TODO: métodos para serializar a JSON para el evento de WebSocket



}