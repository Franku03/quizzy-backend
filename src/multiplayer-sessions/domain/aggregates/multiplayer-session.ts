import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";

import { MultiplayerSessionId } from '../../../core/domain/shared-value-objects/id-objects/multiplayer-session.id';
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date";
import { DomainEvent } from "src/core/domain/abstractions/domain-event";
import { Optional } from "src/core/types/optional";

import { PlayerId, Scoreboard, ScoreboardEntry, SessionPin, SessionProgress, SessionState, SessionStateType, SlideResult } from "../value-objects";
import { Player } from "../entity/session.player";
import { SessionPlayerAnswer } from '../value-objects/slide-result.session-player-answer';
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { PlayerIdValue, SlideIdValue, StateTransition, StateTransitionsTypes } from "../types";



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

    // TODO: Quitar Eventos de dominio pues parace que no los usaré
    private domainEvents: DomainEvent[] = [];

    public constructor(props: MultiplayerSessionProps, id: MultiplayerSessionId){

        super({...props}, id);

    }

    protected checkInvariants(): void {
        
        // ? Estas invariantes son para chequear el Agregado antes de persistirlo, de aplicarlas al construir la sesion por primera vez nos dara error todo
        // * Para empezar una partida se necesita minimo una persona, sin embargo con un plan gratuito solo se pueden tener 10 personas, con plan premium hasta 40 o mas

        /*
        
         No usuarios Duplicados - No tanto por los users, si no por los que juegan como invitados - Esto se cubre gracias al Map<>
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
            throw new Error("Invarianza violada: La partida debe estar END al ser cargada, pues debió finalizar para ser guardada");

        if( !this.getCompletionDate() )
            throw new Error("Invarianza violada: La partida no tiene fecha de culminación");

        if( !this.getStartingDate() )
            throw new Error("Invarianza violada: La partida no tiene fecha de inicio");

        if( this.hasMoreSlidesLeft() )
            throw new Error("Invarianza violada: La partida está incompleta, quedan slides por jugar");

        // * Invarianzas de Jugadores asociados a la partida y sus puntuaciones y respuestas
        
        if( this.properties.players.has( this.getHostId().value ) )
            throw new Error("Invarianza violada: El Host esta resgistrado como jugador en la partida");

        if( this.properties.players.size < 1 )
            throw new Error("Invarianza violada: La partida tiene 0 jugadores asociados");

        if( this.getTotalOfSlides() !== this.properties.playersAnswers.size  )
            throw new Error("Invarianza violada: La partida tiene menos respuestas totales para cada slide que el numero de slides jugadas");


        if( this.getCurrentSlideIndex() !== this.properties.playersAnswers.size  )
            throw new Error("Invarianza violada: El numero de respuestas registradas es incoherente con el numero de slides respondidos");

 
        const players = this.getPlayers();

        for( const player of players ){

            const score = player.getScore();

            const results = this.getOnePlayerAnswers( player.id ).map( results => results ? results.getEarnedScore() : 0 );

            const totalScore = results.reduce(( resA, resB ) => resA + resB , 0);

            if( totalScore !== score )
                throw new Error(`Invarianza violada: el puntaje del jugador id: ${ player.id } nickname: ${ player.getPlayerNickname() } is incoherente, la suma del puntaje de sus respuestas no es igual a su puntaje acumulado`);

        }

    }

    // Para llamar antes de persistir la partida
    public validateAllInvariantsForCompletion(): void{
        this.checkInvariants();
    }

    // * Métodos para manejo de eventos de dominio
    // Este método es protected ya que solo el agregado debe poder registrar eventos de dominio cuanod una regla de negocio ha sido cumplida y un evento debe emitirse
    protected record(event: DomainEvent): void {
        this.domainEvents.push(event);
    }

    // Método público para que la capa de aplicación e infraestructura pueda obtener y limpiar los eventos de dominio pendientes de publicación
    // En este caso no es llamado por el repositorio historico ya que el mismo solo se encarga de persistir la partida cuando esta llega a END
    public pullDomainEvents(): DomainEvent[] {
        // creamos una copia de los eventos actuales y limpiamos el array interno
        const events = this.domainEvents.slice();
        this.domainEvents = [];
        return events;
    }

    // ¿ LOGICA DE JUEGO ESTANDAR - UNIR JUGADORES, ANADIR RESULTADOS A LA SESION Y ACTUALIZAR PUNTAJES Y RANKING

    public isPlayerAlreadyJoined( playerId: PlayerId ): boolean {

        return this.properties.players.has( playerId.value );

    }

    public joinPlayer( player: Player ): void {

        if( player.id.value === this.properties.hostId.value )
            throw new Error("El host de una partida no puede unirse como jugador a la misma")

        // Si un jugador que ya esta unido intenta unirse, se retorna de la funcion sin hacer nada (lo mismo que agarrar su score, borrarlo, y volverlo a unir con el score que tenia)
        if( this.isPlayerAlreadyJoined( player.id ))
            return;

        // Si no estamos en lobby no podemos permitir unir nuevos jugadores
        if( !this.properties.sessionState.isLobby() )
            throw new Error("La partida ya empezó y no se admiten nuevos jugadores");


        this.properties.players.set( player.id.value , player );
        
        this.addEntryToScoreboard( player );
    }

    // Para anadirlos al scoreboard al unirse a la partida
    public addEntryToScoreboard( player: Player ): void {

        this.properties.ranking = this.properties.ranking.addScoreboardEntry( player );
    }

    public deletePlayer( playerId: PlayerId ): boolean {

        // Si no estamos en lobby no podemos permitir borrar jugadores
        if( !this.properties.sessionState.isLobby() )
            throw new Error("La partida ya empezó y no se pueden eliminar jugadores");
        
        return this.properties.players.delete( playerId.value );

    }

    public startSlideResults (slideId: SlideId ): void{

        this.properties.playersAnswers.set( slideId.value , SlideResult.create( slideId ) );

    }


    private addSlideResult(slideId: SlideId, result: SlideResult): void{

        this.properties.playersAnswers.set( slideId.value , result );

    }


    public addPlayerAnswer(slideId: SlideId, playerAnswer: SessionPlayerAnswer): void{

        if( !this.properties.playersAnswers.has( slideId.value  ) )
            throw new Error("La Slide a la cual se intenta añadir una entrada no ha sido puesta aun en juego o no existe")

        const updatedSlideResult =
                this.properties.playersAnswers.get( slideId.value  )?.addResult( playerAnswer )!;

        // Actualizamos con el nuevo SlideResult
        this.addSlideResult( slideId, updatedSlideResult);
    }

    public updatePlayersScores( results: SlideResult ): void {

        const playerResults = results.getPlayersAnswers();

        for( const result of playerResults ){

            const player = this.properties.players.get( result.getPlayerId().value );

            // Actualizamos el score y el streak
            player?.updateScore( Score.create( player.getScore() + result.getEarnedScore() ) );

            player?.updateStreak( result.isCorrect() );

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

    public startSession(): void {

        if( this.getCurrentSlideIndex() !== 0 )
            throw new Error("No se puede empezar una partida en una slide que no sea la primero (O la partida ya comenzó)");

        if( this.properties.players.size < 1 )
            throw new Error("No se puede empezar una partida con menos de un jugador conectado");

        if( !this.properties.sessionState.isLobby() )
            throw new Error("No se puede empezar una partida desde un estado que no esa LOBBY");

        // Empezamos el juego pasando a la primera pregunta
        this.startQuestion();
    }


    private transitionToResults(): StateTransition {

        if( !this.properties.sessionState.isQuestion() )
            throw new Error("No se puede pasar a RESULTS desde un estado que no sea QUESTION");

        // Lógica detransicion

        this.properties.sessionState = this.properties.sessionState.toResults();

        return { state: StateTransitionsTypes.TRANSITION_TO_RESULTS };

    }

    private transitionFromResults(): StateTransition {

        if( !this.properties.sessionState.isResults() )
            throw new Error("No se puede pasar a QUESTION desde un estado que no sea RESULTS");

        // Si no hay mas slides, terminamos la sesion
        if( !this.properties.progress.hasMoreSlidesLeft() ){
            
            return this.endSession(); // Delegamos a endSession el cambio de estado a END

        }

        // Lógica de transicion
        this.startQuestion();

        return { state: StateTransitionsTypes.TRANSITION_TO_QUESTION };
    }


    // Metodo public mediante el cual el caso de uso correspondiente solicita el avance de estado en la partida
    public advanceToNextPhase(): StateTransition {

        const currentState = this.properties.sessionState;

        if( currentState.isQuestion() ){
            return this.transitionToResults();
        }
        
        if( currentState.isResults() ){
            // Estando en RESULTS, intentamos ir a la siguiente pregunta.
            // Si no hay más, transitionQuestion delegará a endSession.
            return this.transitionFromResults();
        }

        throw new Error(`Desde el estado ${currentState.getActualState()} no se puede pasar a RESULT o QUESTION`);


    }

    private endSession(): StateTransition{

        // Terminamos el juego pasando a estado END y generando la fecha de culminacion
        this.properties.sessionState = this.properties.sessionState.toEnd();
        this.properties.completedAt = new Optional<DateISO>( DateISO.generate() );


        return { state: StateTransitionsTypes.TRANSITION_TO_END };
    }

    // ? GETTERS CUSTOM

    // Para obtener datos de los jugadores y el ranking

    public getNumberOfAnswersForASlide( slideId: SlideId ): number{

        return this.getPlayersAnswersForASlide( slideId ).length

    }
    


    public getPlayersAnswersForASlide( slideId: SlideId ): SessionPlayerAnswer[] {

        if( !this.properties.playersAnswers.has( slideId.value ) )
            throw new Error("Los resultados de la Slide solicitada no existen, o no se han registrado resultados aún para la misma");  

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
                // Obtenemos los IDs que seleccionó (asumiendo que answer.selectedOptions es un array de strings)
                // Esto funciona tanto para Single Select como Multi Select
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

    public getPlayerById( playerId: PlayerId ): Player {

        if( !this.isPlayerAlreadyJoined( playerId )  )
            throw new Error("El jugador no se encuentra unido a la sesión");

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


    public getSlideResultsBySlideId( slideId: SlideId ): SlideResult {

        if( !this.properties.playersAnswers.has( slideId.value ))
            throw new Error("La slide solicitada no tiene resultados");

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

    private getCompletionDate(): DateISO {

        if( !this.properties.completedAt.hasValue() )
            throw new Error("FATAL: La sesión no tiene fecha de completación, posiblemente la partida no se ha completado o no se completó")

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

    // TODO: demas getters que luego necesite, capaz uno para sacar datos de una entrie del scoreboard I dunno
    public props(): MultiplayerSessionProps {
        return this.properties;
    }
    
}