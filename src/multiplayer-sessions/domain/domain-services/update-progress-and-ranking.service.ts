import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "../aggregates/multiplayer-session";

import { SlideId } from '../../../core/domain/shared-value-objects/id-objects/kahoot.slide.id';

// Servicio Orquestador que genera cambios en MultiplayerSessions apoyandose de kahoot
export class UpdateSessionProgressAndRankingService {
    
    public updateSessionProgressAndRanking(
       kahoot: Kahoot,
       session: MultiplayerSession, 
    ): void {


        // Actualizamos progreso y ranking de la sesion
        const slideId = session.getCurrentSlideInSession();

        const slideResult = session.getSlideResultsBySlideId( slideId );

        session.updatePlayersScores( slideResult );

        session.updateRanking();

        // Obtenemos la siguiente slide
        const slideSnapshot = kahoot.getNextSlideSnapshotByIndex( session.getCurrentSlideIndex() );

        // Si hay siguiente Slide actualizamos el progress y creamos una nueva entrada de SlideResult, si no lo dejamos tal cual pues deberia estar ya al 100%
        if( slideSnapshot ){

            const nextSlideIdSnapshot = new SlideId( slideSnapshot.id );

            session.updateProgress( nextSlideIdSnapshot ); 

            // ? Aqui creamos la nueva entrada
            session.startSlideResults( nextSlideIdSnapshot);

        }else{
            // * Si no quedan mas slides estamos al final de la partida y tenemos que marcar el progreso como completado

            session.completeProgess(); 

        };
          

    }

}