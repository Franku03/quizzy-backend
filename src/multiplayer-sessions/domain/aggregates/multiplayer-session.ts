/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\aggregates\multiplayer-session.ts

import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";

import { MultiplayerSessionId } from '../../../core/domain/shared-value-objects/id-objects/multiplayer-session.id';
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date";
import { Optional } from "src/core/types/optional";

import { PlayerId, Scoreboard, ScoreboardEntry, SessionPin, SessionProgress, SessionState, SessionStateType, SlideResult } from "../value-objects";
import { Player } from "../entity/session.player";
import { SessionPlayerAnswer } from '../value-objects/slide-result.session-player-answer';
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { PlayerIdValue, SlideIdValue, StateTransition, StateTransitionsTypes } from "../types";
import { IDomainErrorContext } from "src/core/errors/interface/context/i-error-domain.context";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { Either, ErrorData } from "src/core/types";



interface MultiplayerSessionProps {
    readonly hostId: UserId,
    readonly kahootId: KahootId,
    readonly sessionPin: SessionPin,
    readonly startedAt: DateISO,
    completedAt: Optional<DateISO>,
    currentQuestionStartTime: Date, // Timestamp en milisegundos de cuando comenzó la pregunta actual (QUESTION)
    sessionState: SessionState,
    ranking: Scoreboard,
    progress: SessionProgress,
    players: Map<PlayerIdValue, Player>, // Definimos un type alias para el valor del PlayerId dado que de esta manera el Map trabaja con primitivos e impide trabajar con duplicados
    playersAnswers: Map <SlideIdValue, SlideResult> // Lo mismo aqui para el slideId
};

export class MultiplayerSession extends AggregateRoot<MultiplayerSessionProps, MultiplayerSessionId> {

    public constructor(props: MultiplayerSessionProps, id: MultiplayerSessionId){

        super({...props}, id);

    }

    private getContext(operation: string): IDomainErrorContext {
        return createDomainContext('MultiplayerSession', operation, {
            domainObjectKind: 'AggregateRoot',
            domainObjectId: this.id.value
        });
    }
    

    protected checkInvariants(): Either<ErrorData, void> {

        const context = this.getContext('checkInvariants');
        
        // ? Estas invariantes son para chequear el Agregado antes de persistirlo, de aplicarlas al construir la sesion por primera vez nos dara error todo
        // * Para empezar una partida se necesita minimo una persona, sin embargo con un plan gratuito solo se pueden tener 10 personas, con plan premium hasta 40 o mas

        /*
        
         No usuarios Duplicados - Esto se cubre gracias al Map<>
         No host como player - 
         Minimo 1 usuario en la partida
         El numero de SlideResults debe ser igual al numero de slidesAnswered y de totalSlides, esto asegura que efectivamente la partida se jugo al completo
         Los Scores de cada Jugador deben equivaler a la suma de Scores de todas sus respuestas
         Si esta en estado END, el progreso de la partida debe estar en 100 o no deben quedarle slides por responder
            Tambien deberia tener una marca de completacion como completedAt
         Si al reconstruirse tiene un estado que no sea END, algo esta mal pues ninguna partida deberia guardarse con un estado que no sea ese
         
        */

        // * Invarianzas de Estado de completación de la partida y valores que deberian estar presentes
         
        if( !this.properties.sessionState.isEnd() )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { state: ['NOT_END'] }, "Invarianza violada: La partida debe estar END al ser cargada, pues debió finalizar para ser guardada"
            ));

        if( !this.getCompletionDate() )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { completionDate: ['UNAVAILABLE'] }, "Invarianza violada: La partida no tiene fecha de culminación"
            ));

        if( !this.getStartingDate() )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { startingDate: ['UNAVAILABLE'] }, "Invarianza violada: La partida no tiene fecha de inicio"
            ));

        if( this.hasMoreSlidesLeft() )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { slideLeft: ['STILL_LEFT'] }, "Invarianza violada: La partida está incompleta, quedan slides por jugar"
            ));

        // * Invarianzas de Jugadores asociados a la partida y sus puntuaciones y respuestas
        if( this.properties.players.has( this.getHostId().value ) )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { host: ['IS_A_PLAYER'] }, "Invarianza violada: El Host esta resgistrado como jugador en la partida"
            ));

        if( this.properties.players.size < 1 )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { players: ['NO_PLAYERS'] }, "Invarianza violada: La partida tiene 0 jugadores asociados"
            ));

        if( this.getTotalOfSlides() !== this.properties.playersAnswers.size  )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { slidesPlayed: ['INCONSISTENT'] }, "Invarianza violada: La partida tiene menos respuestas en total por cada slide que el numero de slides jugadas"
            ));


        if( this.getCurrentSlideIndex() !== this.properties.playersAnswers.size  )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { answers: ['INCONSISTENT'] }, "Invarianza violada: El numero de respuestas registradas es incoherente con el numero de slides respondidos"
            ));

 
        const players = this.getPlayers();

        for( const player of players ){

            const score = player.getScore();

            const results = this.getOnePlayerAnswers( player.id ).map( results => results ? results.getEarnedScore() : 0 );

            const totalScore = results.reduce(( resA, resB ) => resA + resB , 0);

            if( totalScore !== score )
                return Either.makeLeft(DomainErrorFactory.validation(
                    context, { scores: ['INCONSISTENT'] }, `Invarianza violada: el puntaje del jugador id: ${ player.id } nickname: ${ player.getPlayerNickname() } is incoherente, la suma del puntaje de sus respuestas no es igual a su puntaje acumulado - PR: ${totalScore} | PA: ${ score }`
                ));

        }

        // Chequeada para guardado
        return Either.makeRight( undefined );
    }

    // Para llamar antes de persistir la partida
    public validateAllInvariantsForCompletion(): Either<ErrorData, void> {
        return this.checkInvariants();
    }

    // ¿ LOGICA DE JUEGO ESTANDAR - UNIR JUGADORES, ANADIR RESULTADOS A LA SESION Y ACTUALIZAR PUNTAJES Y RANKING

    public isPlayerAlreadyJoined( playerId: PlayerId ): boolean {

        return this.properties.players.has( playerId.value );

    }

    public joinPlayer( player: Player ): Either<ErrorData, void> {

        const context = this.getContext('joinPlayer');

        if( player.id.value === this.properties.hostId.value )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { host: ['CANNOT_BE_PLAYER'] }, "El host de una partida no puede unirse como jugador a la misma"
            ));

        // Si un jugador que ya esta unido intenta unirse, se retorna de la funcion sin hacer nada (lo mismo que agarrar su score, borrarlo, y volverlo a unir con el score que tenia)
        if( this.isPlayerAlreadyJoined( player.id ))
            return Either.makeRight( undefined );

        // Si no estamos en lobby no podemos permitir unir nuevos jugadores
        if( !this.properties.sessionState.isLobby() )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { state: ['IS_NOT_LOBBY'] }, "La partida ya empezó y no se admiten nuevos jugadores"
            ));

        // Quizas invarianza de no dejar unor por limite de usuarios segun plan del usuario

        // Unimos el jugador a la partida
        this.properties.players.set( player.id.value , player );
        
        // Añadimos su entrada al scoreboard
        this.addEntryToScoreboard( player );

        return Either.makeRight( undefined );
    }

    // Para anadirlos al scoreboard al unirse a la partida
    public addEntryToScoreboard( player: Player ): void {

        this.properties.ranking = this.properties.ranking.addScoreboardEntry( player );
    }

    public deletePlayer( playerId: PlayerId ): Either< ErrorData, boolean > {

        const context = this.getContext('deletePlayer');


        // Si no estamos en lobby no podemos permitir borrar jugadores
        if( !this.properties.sessionState.isLobby() )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { state: ['IS_NOT_LOBBY'] }, "La partida ya empezó y no se pueden ELIMINAR jugadores"
            ));
        
        return Either.makeRight( this.properties.players.delete( playerId.value ) );

    }

    public startSlideResults (slideId: SlideId ): void{

        this.properties.playersAnswers.set( slideId.value , SlideResult.create( slideId ) );

    }


    private addSlideResult(slideId: SlideId, result: SlideResult): void{

        this.properties.playersAnswers.set( slideId.value , result );

    }


    public addPlayerAnswer(slideId: SlideId, playerAnswer: SessionPlayerAnswer): Either< ErrorData, void > {

        const context = this.getContext('addPlayerAnswer');


        if( !this.properties.playersAnswers.has( slideId.value  ) )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { slideResults: ['NO_ENTRY_FOUND'] }, "La Slide a la cual se intenta añadir una entrada no ha sido puesta aún en juego o no existe"
            ));

        const updatedSlideResult =
                this.properties.playersAnswers.get( slideId.value  )?.addResult( playerAnswer )!;

        // Actualizamos con el nuevo SlideResult
        this.addSlideResult( slideId, updatedSlideResult);

        return Either.makeRight( undefined )
    }

    // DEPRECATED, no actualizaba bien los streaks
    public updatePlayersScores( results: SlideResult ): void {

        const playerResults = results.getPlayersAnswers();

        for( const result of playerResults ){

            const player = this.properties.players.get( result.getPlayerId().value );

            // Actualizamos el score y el streak
            player?.updateScore( Score.create( player.getScore() + result.getEarnedScore() ) );

            player?.updateStreak( result.isCorrect() );

        }

    }

    
    public updatePlayersScoresAndStreaks( results: SlideResult ): void {

        const players = this.getPlayers();

        for( const player of players ){

            // Buscamos si el jugador regirtos una respuesta
            const result = results.searchPlayerAnswer( player.id );

            // si no hay respuesta registrada rompemos streak y dejamos su score intacto
            if( !result ){

                player.updateScore( Score.create( player.getScore() ) );
                player.updateStreak( false );

            } else {
                // Si la había actualizamos acorde
                player.updateScore( Score.create( player.getScore() + result.getEarnedScore() ) );
                player.updateStreak( result.isCorrect() );

            }

        }

    }

    public updateRanking(): void {

        this.properties.ranking = this.properties.ranking.updateScoreboard( this.getPlayers() );

    }

    public updateProgress( nextSlide: SlideId ): void {
      
        this.properties.progress = this.properties.progress.addSlideAnswered( nextSlide );

    }

    public completeProgess(): void {
      
        this.properties.progress = this.properties.progress.completeProgress();

    }

    // * LOGICA DE MANEJO DE ESTADOS DE LA SESSION

    private startQuestion(): void {
        // transicionamos el estado a QUESTION y seteamos el timer de inicio de pregunta
        this.properties.sessionState = this.properties.sessionState.toQuestion();
        this.properties.currentQuestionStartTime = new Date();
    }

    public startSession(): Either<ErrorData, void> {

        const context = this.getContext('startSession');

        if( this.getCurrentSlideIndex() !== 0 )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { slide: ['NOT_FIRST_SLIDE'] }, "No se puede empezar una partida en una slide que no sea la primero (O la partida ya comenzó)"
            ));

        if( this.properties.players.size < 1 )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { players: ['NOT_ENOUGH'] }, "No se puede empezar una partida con menos de un jugador conectado"
            ));

        if( !this.properties.sessionState.isLobby() )
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { state: ['NOT_LOBBY'] }, "No se puede empezar una partida desde un estado que no sea LOBBY"
            ));


        // Empezamos el juego pasando a la primera pregunta
        this.startQuestion();

        return Either.makeRight( undefined );
    }


    private transitionToResults(): Either< ErrorData, StateTransition >  {

        const context = this.getContext('transitionToResults');

        if( !this.properties.sessionState.isQuestion() )
            return Either.makeLeft( DomainErrorFactory.validation(
                context, {  state: ['NOT_VALID'] }, "No se puede pasar a RESULTS desde un estado que no sea QUESTION"
            ));

        // Lógica detransicion
        this.properties.sessionState = this.properties.sessionState.toResults();

        return Either.makeRight({ state: StateTransitionsTypes.TRANSITION_TO_RESULTS });

    }

    private transitionFromResults(): Either< ErrorData, StateTransition > {

        const context = this.getContext('transitionFromResults');

        if( !this.properties.sessionState.isResults() )
            return Either.makeLeft( DomainErrorFactory.validation(
                context, {  state: ['NOT_VALID'] }, "No se puede pasar a QUESTION desde un estado que no sea RESULTS"
            ));

        // Si no hay mas slides, terminamos la sesion
        if( !this.properties.progress.hasMoreSlidesLeft() ){
            
            return Either.makeRight( this.endSession() ) ; // Delegamos a endSession el cambio de estado a END

        }

        // Lógica de transicion
        this.startQuestion();

        return Either.makeRight({ state: StateTransitionsTypes.TRANSITION_TO_QUESTION });
    }


    // Metodo public mediante el cual el caso de uso correspondiente solicita el avance de estado en la partida
    public advanceToNextPhase(): Either<ErrorData,StateTransition> {

        const context = this.getContext('advanceToNextPhase');

        const currentState = this.properties.sessionState;

        if( currentState.isQuestion() ){

            const transition = this.transitionToResults()
            
            return transition.map( transition => transition );
        }
        
        if( currentState.isResults() ){
            // Estando en RESULTS, intentamos ir a la siguiente pregunta.
            // Si no hay más, transitionFromResults delegará a endSession.
            const transition = this.transitionFromResults();

            return transition.map( transition => transition );
        }

        // No estamos en un estado valido (END o LOBBY)
        return Either.makeLeft( DomainErrorFactory.validation(
            context, {  state: ['NOT_VALID'] }, "Desde el estado actual de la partida no se puede transicionar a RESULT o QUESTION"
        ));

    }

    private endSession(): StateTransition{

        // Terminamos el juego pasando a estado END y generando la fecha de culminacion
        this.properties.sessionState = this.properties.sessionState.toEnd();
        this.properties.completedAt = new Optional<DateISO>( DateISO.generate() );


        return { state: StateTransitionsTypes.TRANSITION_TO_END };
    }

    // ? GETTERS CUSTOM

    // Para obtener datos de los jugadores y el ranking

    public getNumberOfAnswersForASlide( slideId: SlideId ): number | undefined {

        const numberOfAnswers = this.getPlayersAnswersForASlide( slideId );

        if( !numberOfAnswers )
            return undefined; // No habia slide result para consultar mapeado a ese id

        return numberOfAnswers.length

    }
    


    public getPlayersAnswersForASlide( slideId: SlideId ): SessionPlayerAnswer[] | undefined {

        // Essta validacion nunca salta por como usan el método sus clientes, pero no está de más tenerla
        if( !this.properties.playersAnswers.has( slideId.value ) )
            return undefined; // Los resultados de la Slide solicitada no existen, o no se han registrado resultados aún para la misma

        const playerAnswers = this.properties.playersAnswers.get( slideId.value )?.getPlayersAnswers()!;

        return playerAnswers;

    }


    public getOnePlayerAnswers( playerId: PlayerId ): (SessionPlayerAnswer | undefined)[] {


        const slidesResults = this.getSlidesResults();

        const playerAnswers = slidesResults.map( result => {

           return result.searchPlayerAnswer( playerId );

        })

        return playerAnswers;

    }

    public getOnePlayerAnswerForASlide( slideId: SlideId, playerId: PlayerId ): SessionPlayerAnswer | undefined {
            
        // Intentamos obtener la respuesta del jugador para esta slide
        const slideResults = this.getSlideResultsBySlideId( slideId );

        if( !slideResults )
            return undefined

        // obtenemos la respuesta en cuestion
        const answer = slideResults.searchPlayerAnswer( playerId );

        return answer;
        
    }

    public hasPlayerAnsweredSlide( slideId: SlideId, playerIdValue: PlayerId ): boolean { 
        return this.getOnePlayerAnswerForASlide( slideId, playerIdValue ) !== undefined;
    }


    // Calcula la distribución de respuestas para una slide específica.
    public calculateAnswerDistributionForASlide( slideId: SlideId, possibleOptionIds: string[] ): Record<string, number> {
        
        // 1) Inicializamos el mapa de distribución con 0 para todas las opciones posibles.
        // Esto asegura que si nadie votó por la opción "C", aparezca "C: 0" y no "undefined".
        const distribution: Record<string, number> = {};
        possibleOptionIds.forEach(id => {
            distribution[id] = 0;
        });

        // 2) Iteramos sobre los jugadores registrados
        for (const player of this.properties.players.values()) {
            
            // Intentamos obtener la respuesta del jugador para esta slide
            const answer = this.getOnePlayerAnswerForASlide( slideId, player.id );

            // Si el jugador respondió
            if (answer) {
                // Obtenemos los IDs que seleccionó
                // Esto funciona tanto para selección simple y múltiple
                const selectedIds = answer.getAnswerIndex(); 

                selectedIds.forEach( optionId => {

                    const optionIdString = optionId.toString()
                    // Solo contamos si el ID es válido (protección defensiva)
                    if (distribution[optionIdString] !== undefined) {
                        distribution[optionIdString]++;
                    }
                    
                });

            }
        }

        return distribution;
    }


        
    public getPlayersRankingEntries(): ScoreboardEntry[] {

        return this.properties.ranking.getEntries();

    }

    public getOnePlayerRankingEntry( playerId: PlayerId ): ScoreboardEntry {
        return this.properties.ranking.getEntryFor( playerId );

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

    public getPlayerById( playerId: PlayerId ): Player | undefined  {

        if( !this.isPlayerAlreadyJoined( playerId )  )
             return undefined

        return  this.properties.players.get( playerId.value )!

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

    // Para obtener informacion relacionado al progreso de la partida

    public getSessionProgress(): number {

        return this.properties.progress.getProgressPercentage() ;

    }

    public getNumberOfSlidesLeft(): number {

        return this.properties.progress.getHowManySlidesAreLeft() ;

    }


    public getCurrentSlideIndex(): number {

        return this.properties.progress.getNumberOfSlidesAnswered() ;

    }


    public getTotalOfSlides(): number {

        return this.properties.progress.getNumberOfTotalSlides() ;

    }

    public hasMoreSlidesLeft(): boolean {

        return this.properties.progress.hasMoreSlidesLeft() ;

    }

    public getSlidesResults(): SlideResult[] {

        return [...this.properties.playersAnswers.values()]

    }


    public getSlideResultsBySlideId( slideId: SlideId ): SlideResult | undefined {

        if( !this.properties.playersAnswers.has( slideId.value ) )
            return undefined
            // throw new Error("La slide solicitada no tiene resultados");

        return this.properties.playersAnswers.get( slideId.value )!


    }


    public getCurrentSlideInSession(): SlideId {

        return this.properties.progress.getCurrentSlide();

    }

    public getPreviousSlideInSession(): SlideId | undefined{

        return this.properties.progress.getPreviousSlide();

    }


    // ? GETTERS NORMALES

    public getSessionPin(): string {
        return this.properties.sessionPin.getPin();
    }

    public getSessionStateType(): SessionStateType {
        return this.properties.sessionState.getActualState();
    }

    public getSessionState(): SessionState {
        return this.properties.sessionState;
    }


    private getStartingDate(): DateISO {

        return this.properties.startedAt ;
        
    }

    private getCompletionDate(): DateISO | undefined {

        if( !this.properties.completedAt.hasValue() )
            return undefined

        return this.properties.completedAt.getValue();

    }

    public getCurrentQuestionStartTime(): Date {
        return this.properties.currentQuestionStartTime;
    }

    public getHostId(): UserId {
        return this.properties.hostId;
    }

    public getKahootId(): KahootId {
        return this.properties.kahootId;
    }

    // Para Sacar las props y guardar en persistencia
    public props(): MultiplayerSessionProps {
        return this.properties;
    }
    
}