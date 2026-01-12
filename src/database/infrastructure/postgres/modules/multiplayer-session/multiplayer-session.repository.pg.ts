import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { IMultiplayerSessionHistoryRepository } from "src/multiplayer-sessions/domain/ports";
import type { IErrorMapper } from "src/core/errors/interface/mapper/i-error-mapper.interface";

import { MultiplayerSessionEntity } from "../../entities/multiplayer-session.entity.pg";
import { RepositoryPostgres } from "../../decorators/repository-postgres.registry";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { MULTIPLAYER_SESSIONS_POSTGRES_BASE } from "./constants/multiplayer-sessions.pg-constants";
import { ERROR_TOKENS } from "src/core/errors/dependecy-tokens/application-core-erros.tokens";
import { IDatabaseErrorContext } from "src/core/errors/interface/context/i-error-database.context";
import { createDatabaseContext } from "src/core/errors/helpers/database-error-context.helper";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { Either, ErrorData } from "src/core/types";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";

@RepositoryPostgres(RepositoryName.MultiplayerSession)
@Injectable()
export class MultiplayerSessionHistoryPostgresRepository implements IMultiplayerSessionHistoryRepository {

  private readonly contextBase = MULTIPLAYER_SESSIONS_POSTGRES_BASE;
  private readonly adapterName = MultiplayerSessionHistoryPostgresRepository.name;
  private readonly portName = 'IMultiplayerSessionHistoryRepository';

  constructor(
    @InjectRepository(MultiplayerSessionEntity)
    private readonly repo: Repository<MultiplayerSessionEntity>,

    @Inject(ERROR_TOKENS.MAPPERS.POSTGRES)
    private readonly pgErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,
  ) {}

  public async archiveSession(session: MultiplayerSession, kahoot: Kahoot): Promise<void> {
    const result = await this.archiveSessionEither(session, kahoot);
    if (result.isLeft()) throw result.getLeft();
  }

  public async archiveSessionEither(
    session: MultiplayerSession,
    kahoot: Kahoot
  ): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('archiveSession', session.id.value);
    
    const sessionPersistenceData = this.mapToPersistence(session, kahoot);

    const result = await Either.tryCatch(
        this.repo.save( sessionPersistenceData ),
        ( err ) => this.pgErrorMapper.toErrorData( err, ctx )
    )

    return result.map( () => undefined );

  }

  private mapToPersistence(session: MultiplayerSession, kahoot: Kahoot): MultiplayerSessionEntity {
    const props = session.props();
    const sessionData = this.generateSessionJsonData(session, kahoot);

    const entity = new MultiplayerSessionEntity();
    entity.sessionId = session.id.value;
    entity.sessionPin = props.sessionPin.getPin();
    entity.kahootId = props.kahootId.value;
    entity.hostId = props.hostId.value; // ID plano sin FK
    // entity.startedAt = new Date(props.startedAt.value);
    // entity.completedAt = props.completedAt.hasValue() ? new Date(props.completedAt.getValue().value) : null;
    
    // Agrupamos el resto en el objeto JSONB
    entity.players = sessionData.players;
    entity.ranking =  sessionData.ranking;
    entity.slideResults =  sessionData.slideResults;
    entity.totalProgress =  sessionData.totalProgress;
    entity.timeDetails = sessionData.timeDetails;

    return entity;
  }

  // Tu lógica de mapeo se mantiene casi idéntica
  private generateSessionJsonData(session: MultiplayerSession, kahoot: Kahoot) {
    const props = session.props();

    const playersArray = Array.from(props.players.entries()).map(([playerIdValue, player]) => ({
      playerId: playerIdValue,
      nickname: player.getPlayerNickname(),
      score: player.getScore(),
      isGuest: player.isGuest(),
      answersSubmitted: session.getOnePlayerAnswers(player.id).filter(a => a !== undefined).length,
    }));

    const slideResultsArray = Array.from(props.playersAnswers.entries()).map(([slideIdValue, slideResult]) => {
      const playerAnswers = slideResult.getPlayersAnswers();
      const currentSlideSnapshot = kahoot.getSlideSnapshotById(new SlideId(slideIdValue));

      return {
        slideId: slideIdValue,
        slidePosition: currentSlideSnapshot?.position ?? 0,
        numberOfSubmissions: playerAnswers.length,
        questionData: currentSlideSnapshot ? {
          questionText: currentSlideSnapshot.questionText ?? "",
          basePoints: currentSlideSnapshot.pointsValue ?? 0,
          timeLimit: currentSlideSnapshot.timeLimitSeconds,
          optionsContent: currentSlideSnapshot.options.map((opt, idx) => ({
            index: idx,
            type: opt.optionImageId! ? 'IMAGE' : 'TEXT',
            value: (opt.optionImageId ? opt.optionImageId : opt.optionText) ?? "" ,
            isCorrect: opt.isCorrect,
          }))
        } : {
            questionText: '',
            basePoints: 0,
            timeLimit: 0,
            optionsContent: []
        },
        submissions: playerAnswers.map( answer => ({
          playerId: answer.getPlayerId().value,
          slideId: slideIdValue,
          earnedScore: answer.getEarnedScore(),
          timeElapsed: answer.getTimeElapsed().toMilliseconds(),       
          isAnswerCorrect: answer.isCorrect(),
          answerSelected: answer.getProperties().answerContent.map(( content, index )=> ({
            answerIndex: answer.getAnswerIndex()[index] ,
            isCorrect: content.isCorrect,
            answerContent: {
              type: content.hasImage() ? 'IMAGE' : 'TEXT',
              value: content.getAnswerContent() ?? ""
            }
          })) || []
        })),

      };
    });

    return {
      players: playersArray,
      ranking: props.ranking.getEntries().map(e => ({
        playerId: e.getPlayerId().value,
        nickname: e.getNickname(),
        score: e.getScore(),
        rank: e.getRank()
      })),
      slideResults: slideResultsArray,
      totalProgress: {
        lastSlidePlayedId: props.progress.getCurrentSlide().value,
        totalSlidesPlayed: props.progress.getNumberOfSlidesAnswered()
      },
      timeDetails: {
        startedAt: new Date(props.startedAt.value),
        completedAt: props.completedAt.hasValue() ? new Date(props.completedAt.getValue().value) : new Date ()
      }
    };
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

}