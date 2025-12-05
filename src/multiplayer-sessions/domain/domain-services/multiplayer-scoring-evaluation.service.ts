import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "../aggregates/multiplayer-session";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";

import { PlayerId, SessionPlayerAnswer, SlideResult } from "../value-objects";
import { PlayerIdValue, SlideIdValue } from "../types/id-value.types";
import { SlideId } from '../../../core/domain/shared-value-objects/id-objects/kahoot.slide.id';

// ! Nota: la primera vez que llamemos a getNextSlideSnapshotByIndex debera ser desde el inicio de la partida y sin argumento para que el conteo con el progress cuadre

// Servicio Orquestador que genera cambios en MultiplayerSessions apoyandose de kahoot
export class MultiplayerScoringEvaluationService {
    

    // La submission ya viene construida en base al DTO desde el servicio de aplicacion
    public evaluateScore(
       kahoot: Kahoot,
       session: MultiplayerSession, 
       submissions: Map<PlayerIdValue, Submission>, // Evaluar si capaz es mejor un arreglo de tuplas I dunno
       slideId: SlideIdValue
    ): void {


        /*
            1) iteramos por el map sacando id de jugador y subsmission, creamos un PlayerId temporal para llamar a getPlayetById() de Session y obtener la referencia al Player y su PlayerId real
            2) llamamos a EvaluateAnswer de Kahoot pasandole el submission que ya contiene el SlideId
            3) Obtenemos el Result, el cual usaremos para construir el SessionPlayerAnswer de un jugador en especifico pasando el PlayerId que obtuvimos en el paso 1
            4) hacemos esto por cada iteracion del Map
            5) Una vez tenemos todos los SessionPlayerAnswers, los cuales fuimos guardando en un arreglo, creamos un SlideResult
            6) llamamos a addSlideResult del session y añadimos la respuesta
            6) llamamos a updatePlayersScores() pasando este nuevo SlideResult
            7) llamados a updateRanking() de session para actualizar el scoreboard
            8) llamamos a updateProgress obteniendo previamente el SlideSnapshot del siguiente slide a jugar, pasando el slidesAnswered del progress como parametro
            9) quizas esto tenga mas pasos pero no se que hara la capa de aplicacion con estos cambios sobre el objeto ni que gestionaran los eventos
        */

        const playersResults: SessionPlayerAnswer[] = [];


        for( const [ playerIdValue, playerSubmission ] of submissions.entries() ) {

            const tempId = new PlayerId( playerIdValue );

            const playerId = session.getPlayerById( tempId ).id;

            // ? Momento donde se evalua la respuesta
            const result = kahoot.evaluateAnswer( playerSubmission );

            playersResults.push( SessionPlayerAnswer.create( result, playerId ) );

        }

        // Actualizamos resultados de slide Actual
        const currentSlideIdSnapshot = new SlideId( slideId );

        // const slideResult = SlideResult.create( currentSlideIdSnapshot, playersResults )

        const slideResult = SlideResult.create( currentSlideIdSnapshot )


        session.addSlideResult( currentSlideIdSnapshot, slideResult );

        session.updatePlayersScores( slideResult );

        session.updateRanking();

        // Obtenemos la siguiente slide
        const slideSnapshot = kahoot.getNextSlideSnapshotByIndex( session.getTotalOfSlidesAnswered() );

        // Si hay siguiente Slide actualizamos el progress, si no lo dejamos tal cual pues deberia estar ya al 100%
        if( slideSnapshot ){

            const nextSlideIdSnapshot = new SlideId( slideSnapshot.id );

            session.updateProgress( nextSlideIdSnapshot ); 

        }
            

     

    }

}