// multiplayer-session.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MultiplayerSession } from 'src/multiplayer-sessions/domain/aggregates/multiplayer-session';
import { MultiplayerSessionMongo } from '../../entities/multiplayer-session.schema';
import { IMultiplayerSessionHistoryRepository } from 'src/multiplayer-sessions/domain/ports';


@Injectable()
export class MultiplayerSessionHistoryMongoRepository implements IMultiplayerSessionHistoryRepository {
  constructor(
    @InjectModel(MultiplayerSessionMongo.name) 
    private readonly sessionModel: Model<MultiplayerSessionMongo>
  ) {}

 async archiveSession(session: MultiplayerSession): Promise<void> {
  try {
    const props = session.props();
    
    // ... (tu código de playersArray está bien) ...
    const playersArray = Array.from(props.players.entries()).map(([playerIdValue, player]) => ({
      playerId: playerIdValue,
      nickname: player.getPlayerNickname(),
      score: player.getScore(),
    }));

    const slideResultsArray = Array.from(props.playersAnswers.entries()).map(([slideIdValue, slideResult]) => {
        const playerAnswers = slideResult.getPlayersAnswers();
        
        // Mapear submissions
        const submissions = playerAnswers.map(answer => ({
          playerId: answer.getPlayerId().value,
          slideId: slideIdValue,
          answerIndex: answer.getAnswerIndex(),
          isAnswerCorrect: answer.isCorrect(),
          earnedScore: answer.getEarnedScore(),
          
          // --- CORRECCIÓN 1: timeElapsed ---
          // El log mostraba "timeElapsed: [ResponseTime]"
          // Asumimos que tiene .value o .getValue() para obtener el número
          timeElapsed: answer.getTimeElapsed().toMilliseconds(), 
          
          answerContent: answer.getProperties().answerContent?.map(content => ({
            isCorrect: content.isCorrect,
            answerContent: {
              type: content.hasImage() ? 'IMAGE' : 'TEXT',
              value: content.getAnswerContent()
            }
          })) || []
        }));

        // Helper para no repetir código y limpiar la lectura
        const snapshot = playerAnswers.length > 0 ? playerAnswers[0].getQuestionSnapshot() : null;

        return {
          slideId: slideIdValue,
          slidePosition: 0, 
          
          questionSnapshot: snapshot ? {
            questionText: snapshot.questionText,
            
            // --- CORRECCIÓN 2: basePoints ---
            // Antes: snapshot.basePoints (Objeto Points)
            // Ahora: snapshot.basePoints.value (Número 1000)
            basePoints: snapshot.basePoints.value, 

            // --- CORRECCIÓN 3: timeLimit ---
            // Antes: snapshot.timeLimit (Objeto TimeLimitSeconds)
            // Ahora: snapshot.timeLimit.value (Número)
            timeLimit: snapshot.timeLimit.value,

            // --- CORRECCIÓN 4: correctAnswerIndices ---
            // Antes: estabas pasando "snapshot" (el objeto entero) a este campo
            // Ahora: pasamos la propiedad específica dentro del snapshot
            // correctAnswerIndices: snapshot
          } : {
            questionText: '',
            basePoints: 0,
            timeLimit: 0,
            // correctAnswerIndices: []
          },
          submissions: submissions,
          // startedAt: new Date(), 
          // endedAt: new Date() 
        };
      });

      const sessionData = {
        sessionId: session.id.value,
        hostId: props.hostId.value,
        kahootId: props.kahootId.value,
        sessionPin: props.sessionPin.getPin(),
        state: props.sessionState.getActualState(),
        
        timeDetails: {
          startedAt: props.startedAt.value,
          lastActivityAt: new Date(),
          completedAt: props.completedAt.hasValue() ? props.completedAt.getValue().value : null
        },
        
        progress: {
          // currentSlideId: null, // Ojo: ¿seguro que quieres null aquí siempre?
          // currentQuestionStartTime: null,
          // slideOrder: [],
          currentSlideIndex: 0,
          totalSlides: props.progress.getNumberOfTotalSlides()
        },
        
        ranking: props.ranking.getEntries().map(entry => ({
          playerId: entry.getPlayerId().value,
          nickname: entry.getNickname(),
          score: entry.getScore(),
          rank: entry.getRank(),
          previousRank: entry.getPreviousRank()
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