/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\multiplayer-session\multiplayer-session.repository.mongo.ts

import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MultiplayerSession } from 'src/multiplayer-sessions/domain/aggregates/multiplayer-session';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { SlideId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.slide.id';

import { MultiplayerSessionMongo } from '../../entities/multiplayer-session.schema';
import { IMultiplayerSessionHistoryRepository } from 'src/multiplayer-sessions/domain/ports';
import { RepositoryMongo } from '../../decorators/repository-mongo.decorator';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';
import { MULTIPLAYER_SESSIONS_MONGO_BASE } from './constants/multiplayer-session.mongo-constants';

import { Either, ErrorData } from 'src/core/types';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

@RepositoryMongo(RepositoryName.MultiplayerSession)
@Injectable()
export class MultiplayerSessionHistoryMongoRepository implements IMultiplayerSessionHistoryRepository {

  private readonly contextBase = MULTIPLAYER_SESSIONS_MONGO_BASE;
  private readonly adapterName = MultiplayerSessionMongo.name;
  private readonly portName = 'IMultiplayerSessionHistoryRepository';


  constructor(
    @InjectModel(MultiplayerSessionMongo.name) 
    private readonly sessionModel: Model<MultiplayerSessionMongo>,

    @Inject(ERROR_TOKENS.MAPPERS.MONGO)
    private readonly mongoErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,
  ) {}


  async archiveSessionEither( session: MultiplayerSession, kahoot: Kahoot ): Promise<Either<ErrorData, void>> {

    const ctx = this.getCtx('archiveSession', session.id.value);

    const sessionData = this.mapToPersistence( session, kahoot );

    const result = await Either.tryCatch(
      this.sessionModel.findOneAndUpdate(
        
        { sessionId: session.id.value },
        { $set: sessionData },
        { upsert: true, new: true, runValidators: true }

      ).exec(),
      ( err ) => this.mongoErrorMapper.toErrorData( err, ctx )
    );

    return result.map( () => undefined );

  }


 async archiveSession(session: MultiplayerSession, kahoot: Kahoot ): Promise<void> {

    const result = await this.archiveSessionEither( session, kahoot );

    if (result.isLeft()) throw result.getLeft();

 } 


  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  /**
   * Genera el contexto usando la factory del Core.
   */
  private getCtx(operation: string, entityId?: string, extra?: Record<string, unknown>) {
    return createDatabaseContext(
      this.contextBase,
      this.adapterName,
      this.portName,
      operation,
      entityId,
      extra
    );
  }


  private mapToPersistence( session: MultiplayerSession, kahoot: Kahoot ) {

    const props = session.props();

    // Mapear información de jugadores

    const playersArray = Array.from(props.players.entries()).map(([playerIdValue, player]) => ({
      playerId: playerIdValue,
      nickname: player.getPlayerNickname(),
      score: player.getScore(),
      isGuest: player.isGuest(),
      answersSubmitted: session.getOnePlayerAnswers( player.id ).filter( answer => answer !== undefined ).length,
    }));


    // Mappear resultados de cada Slide
    const slideResultsArray = Array.from( props.playersAnswers.entries() ).map(([slideIdValue, slideResult]) => {

        const playerAnswers = slideResult.getPlayersAnswers();
        
        // Mapear submissions
        const submissions = playerAnswers.map( answer => ({
          playerId: answer.getPlayerId().value,
          slideId: slideIdValue,
          // answerIndex: answer.getAnswerIndex(),
          earnedScore: answer.getEarnedScore(),
          timeElapsed: answer.getTimeElapsed().toMilliseconds(),       
          isAnswerCorrect: answer.isCorrect(),
          answerSelected: answer.getProperties().answerContent.map(( content, index )=> ({
            answerIndex: answer.getAnswerIndex()[index] ,
            isCorrect: content.isCorrect,
            answerContent: {
              type: content.hasImage() ? 'IMAGE' : 'TEXT',
              value: content.getAnswerContent()
            }
          })) || []
        }));

        // Mappear los Datos de la Slide jugada
        const currentSlideSnapshot = kahoot.getSlideSnapshotById( new SlideId( slideIdValue ) );

        const optionsSnapshot = currentSlideSnapshot?.options.map( (options, index) => ({
              index: index,
              type: options.optionImageId ? 'IMAGE' : 'TEXT',
              value: options.optionImageId ? options.optionImageId : options.optionText,
              isCorrect: options.isCorrect,
        }))

        return {

          slideId: slideIdValue,
          slidePosition: currentSlideSnapshot?.position ?? 0,
          numberOfSubmissions: slideResult.getPlayersAnswers().length,
          questionData: currentSlideSnapshot ? {
            questionText: currentSlideSnapshot.questionText ?? "",
            basePoints: currentSlideSnapshot.pointsValue ?? 0, 
            timeLimit: currentSlideSnapshot.timeLimitSeconds,
            optionsContent: optionsSnapshot
          } : {
            questionText: '',
            basePoints: 0,
            timeLimit: 0,
            optionsContent: []
          },

          submissions: submissions,

        };
      });

      const kahootDetails = kahoot.details.hasValue() ? kahoot.details.getValue() : undefined;
      const kahootTitle = kahootDetails?.title.hasValue() ? kahootDetails.title.getValue() : "Kahoot sin título";

      const sessionData = {

        sessionId: session.id.value,
        hostId: props.hostId.value,
        kahootId: props.kahootId.value,
        sessionPin: props.sessionPin.getPin(),
        kahootTitle: kahootTitle ?? "Kahoot sin título",
        
        timeDetails: {
          startedAt: props.startedAt.value,
          completedAt: props.completedAt.hasValue() ? props.completedAt.getValue().value : null
        },
         
        ranking: props.ranking.getEntries().map(entry => ({
          playerId: entry.getPlayerId().value,
          nickname: entry.getNickname(),
          score: entry.getScore(),
          rank: entry.getRank(),
        })),
        
        players: playersArray,

        totalProgress: {
          lastSlidePlayedId: props.progress.getCurrentSlide().value,
          totalSlidesPlayed: props.progress.getNumberOfSlidesAnswered()
        },

        slideResults: slideResultsArray,

      };

      return sessionData;

  }

}