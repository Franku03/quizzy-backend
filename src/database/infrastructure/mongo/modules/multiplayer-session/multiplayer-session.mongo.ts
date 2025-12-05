// multiplayer-session.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MultiplayerSession } from 'src/multiplayer-sessions/domain/aggregates/multiplayer-session';
import { MultiplayerSessionMongo } from '../../entities/multiplayer-session.schema';
import { IMultiplayerSessionRepository } from 'src/multiplayer-sessions/domain/ports';


@Injectable()
export class MultiplayerSessionRepository implements IMultiplayerSessionRepository {
  constructor(
    @InjectModel(MultiplayerSessionMongo.name) 
    private readonly sessionModel: Model<MultiplayerSessionMongo>
  ) {}

  async saveSession(session: MultiplayerSession): Promise<void> {
  try {
    const props = session.props();
    
    // Convertir Maps a arrays para guardar en MongoDB
    const playersArray = Array.from(props.players.entries()).map(([playerIdValue, player]) => ({
      playerId: playerIdValue,
      nickname: player.getPlayerNickname(),
      score: player.getScore(),
    }));

    const slideResultsArray = Array.from(props.playersAnswers.entries()).map(([slideIdValue, slideResult]) => {
      // Obtener las respuestas de los jugadores usando getters
      const playerAnswers = slideResult.getPlayersAnswers();
      
      // Mapear las respuestas a submissions usando getters
      const submissions = playerAnswers.map(answer => ({
        playerId: answer.getPlayerId().value,
        slideId: slideIdValue,
        answerIndex: answer.getAnswerIndex(),
        isAnswerCorrect: answer.isCorrect(),
        earnedScore: answer.getEarnedScore(),
        timeElapsed: answer.getTimeElapsed(),
        answerContent: answer.getProperties().answerContent?.map(content => ({
          isCorrect: content.isCorrect,
          answerContent: {
            type: content.hasImage() ? 'IMAGE' : 'TEXT',
            value: content.getAnswerContent()
          }
        })) || []
      }));

      return {
        slideId: slideIdValue,
        slidePosition: 0, 
        questionSnapshot: playerAnswers.length > 0 ? {
          questionText: playerAnswers[0].getQuestionSnapshot().questionText,
          basePoints: playerAnswers[0].getQuestionSnapshot().basePoints,
          timeLimit: playerAnswers[0].getQuestionSnapshot().timeLimit,
          correctAnswerIndices: playerAnswers[0].getQuestionSnapshot()
        } : {
          questionText: '',
          basePoints: 0,
          timeLimit: 0,
          correctAnswerIndices: []
        },
        submissions: submissions,
        startedAt: new Date(), 
        endedAt: new Date() 
      };
    });

    const sessionData = {
      sessionId: session.id.value,
      hostId: props.hostId.value,
      kahootId: props.kahootId.value,
      sessionPin: props.sessionPin.getPin(),
      state: props.sessionState.getActualState(),
      
      timeDetails: {
        startedAt: props.startedAt,
        lastActivityAt: new Date(),
        completedAt: props.completedAt.hasValue() ? props.completedAt.getValue() : null
      },
      
      // Progress simplificado - solo información mínima
      progress: {
        currentSlideId: null,
        currentQuestionStartTime: null,
        slideOrder: [],
        currentSlideIndex: 0,
        totalSlides: props.progress.getNumberOfTotalSlides()
      },
      
      // CORREGIDO: Usar getEntries() en lugar de .entries
      ranking: props.ranking.getEntries().map(entry => ({
        playerId: entry.getPlayerId().value,
        nickname: entry.getNickname(),
        score: entry.getScore(),
        rank: entry.getRank(),
        previousRank: entry.getPreviousRank() // Nota: en tu clase ScoreboardEntry, getPreviousRank() retorna rank en lugar de previousRank
      })),
      
      players: playersArray,
      slideResults: slideResultsArray,
    };

    await this.sessionModel.findOneAndUpdate(
      { sessionId: sessionData.sessionId },
      { $set: sessionData },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );

  } catch (error) {
    console.error('Error saving multiplayer session:', error);
    throw new Error(`Failed to save session: ${error.message}`);
  }
}
}