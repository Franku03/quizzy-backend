/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\domain-services\update-progress-and-ranking.service.ts

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "../aggregates/multiplayer-session";

import { SlideId } from '../../../core/domain/shared-value-objects/id-objects/kahoot.slide.id';
import { Either, ErrorData } from "src/core/types";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

// Servicio Orquestador que genera cambios en MultiplayerSessions apoyandose de kahoot
export class UpdateSessionProgressAndRankingService {
    
    public updateSessionProgressAndRanking(
       kahoot: Kahoot,
       session: MultiplayerSession, 
    ): Either< ErrorData, void > {


        // Actualizamos progreso y ranking de la sesion
        const slideId = session.getCurrentSlideInSession();

        const slideResult = session.getSlideResultsBySlideId( slideId );

        if( !slideResult ){
            const error = new Error("No hay resultados asociados a la slide solicitada")
            return Either.makeLeft( this.buildUpdateRankingProgressErrorData( error ) );
        }

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

        return Either.makeRight( undefined );
          

    }


    private buildUpdateRankingProgressErrorData( error: Error ): ErrorData {

        return DomainErrorFactory.validation(
            createDomainContext('updateSessionProgressAndRanking', 'DomainService', { domainObjectKind: 'DomainService', rootAggregateName: 'MultiplayerSession'} ),
            {},
            error.message
        );

    }

}