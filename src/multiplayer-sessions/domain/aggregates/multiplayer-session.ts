import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";

import { MultiplayerSessionId } from '../../../core/domain/shared-value-objects/id-objects/multiplayer-session.id';
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";

import { PlayerId, Scoreboard, ScoreboardEntry, SessionPin, SessionProgress, SessionState, SlideResult } from "../value-objects";
import { Player } from "../entity/session.player";
import { SessionPlayerAnswer } from '../value-objects/slide-result.session-player-answer';
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";

interface MultiplayerSessionProps {
    hostId: UserId,
    kahootId: KahootId,
    sessionPin: SessionPin,
    startedAt: Date,
    sessionState: SessionState,
    ranking: Scoreboard,
    progress: SessionProgress,
    players: Map<PlayerId, Player>,
    playersAnswers: Map <SlideId, SlideResult>
};

export class MultiplayerSession extends AggregateRoot<MultiplayerSessionProps, MultiplayerSessionId> {

    public constructor(props: MultiplayerSessionProps, id: MultiplayerSessionId){

        super({...props}, id);

    }

    protected checkInvariants(): void {
        
        // TODO: Revisar invarianzas

        /*
         No usuarios Duplicados
         No host como player
         
        */


    }

    // ¿ LOGICA DE JUEGO ESTANDAR - UNIR JUGADORES, ANADIR RESULTADOS A LA SESION Y ACTUALIZAR PUNTAJES Y RANKING


    public joinPlayer( player: Player ): void {

        if( player.id.value === this.properties.hostId.value )
            throw new Error("El host de una partida no puede unirse como jugador a la misma")

        // Si un jugador que ya esta unido intenta unirse, se borrara su anterior instancia y se volvera a unir bajo una nueva
        if( this.properties.players.has( player.id ) )
            this.deletePlayer( player.id );
        
        this.properties.players.set( player.id, player );

    }

    public deletePlayer( playerId: PlayerId ): boolean {
        
        return this.properties.players.delete( playerId );

    }

    public addSlideResult(slideId: SlideId, result: SlideResult){

        this.properties.playersAnswers.set( slideId, result );

    }

    public updatePlayersScores( results: SlideResult ): void {

        const playerResults = results.getPlayersAnswers();

        for( const result of playerResults ){

            // * Quizas no devuelve la referencia al objeto, espero que si
            const player = this.properties.players.get( result.getPlayerId() );

            player?.updateScore( Score.create( player.getScore() + result.getEarnedScore() ) );

        }

    }

    public updateRanking(): void {

        this.properties.ranking = this.properties.ranking.updateScoreboard( this.getPlayers() );

    }

    // * LOGICA DE MANEJO DE ESTADOS DE LA SESSION


    public startSession(): SessionState {
        // Empezamos el juego pasando a la primera pregunta
        this.properties.sessionState = this.properties.sessionState.toQuestion();

        return this.properties.sessionState;
    }

    public advanceToNextPhase(): SessionState {
        
        if( !this.properties.progress.hasMoreSlidesLeft() )
            return this.endSession();

        if( this.properties.sessionState.isQuestion() ){

            this.properties.sessionState = this.properties.sessionState.toResults();

        } else if( this.properties.sessionState.isResults()){

            // ? Podria llamarse aqui al updatePlayerScores
            this.properties.sessionState = this.properties.sessionState.toQuestion();

        } else {
            throw new Error("Desde el estado actual no se puede pasar a RESULT o QUESTION");
        }

        return this.properties.sessionState;
    }

    public endSession(): SessionState {
        // Terminamos el juego pasando a estado END
        this.properties.sessionState = this.properties.sessionState.toEnd();

        return this.properties.sessionState;

    }

    // ? GETTERS CUSTOM

    public getPlayersAnswers( slideId: SlideId ): SessionPlayerAnswer[] {

        if( !this.properties.playersAnswers.has( slideId ) )
            throw new Error("Los resultados de la Slide solicitada no existen, o no se han registrado resultados aún para la misma");  

        const playerAnswers = this.properties.playersAnswers.get( slideId )?.getPlayersAnswers()!;

        return playerAnswers;

    }

    
    public getPlayersScores(): ([ PlayerId , number ])[] {

        const playerScores = this.getPlayers()
                                .map( player => { 

                                    const playerData: [ PlayerId , number ] = [ player.id , player.getScore() ]

                                    return playerData;

                                });

        return playerScores;

    }


    public getPlayers(): Player[] {

        return  [...this.properties.players.values()] ;

    }

  
    public getTopThree(): ScoreboardEntry[] {

        return  this.properties.ranking.getTop( 3 ) ;
        
    }  

    public getTopFive(): ScoreboardEntry[] {

        return  this.properties.ranking.getTop( 5 ) ;
        
    }

    public getScoreboardEntryFor( playerId: PlayerId ): ScoreboardEntry {

        return  this.properties.ranking.getEntryFor( playerId ) ;
        
    }


    public getSessionProgress(): number {

        return this.properties.progress.getProgressPercentage() ;

    }

    // ? GETTERS NORMALES

    public getSessionPin(): SessionPin {
        return this.properties.sessionPin;
    }

    public getStartingDate(): Date {

        return  this.properties.startedAt ;
        
    }

    public getHostId(): UserId {
        return this.properties.hostId;
    }

    public getKahootId(): KahootId {
        return this.properties.kahootId;
    }

    // TODO: demas getters que luego necesite, capaz uno para sacar datos de una entrie del scoreboard I dunno



    
}