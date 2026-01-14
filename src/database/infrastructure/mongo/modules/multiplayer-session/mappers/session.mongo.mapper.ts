import { MultiplayerSessionMapper } from "src/reports/application/ports/i-multiplayer-session-mapper";
import { MultiplayerSessionMongo } from "../../../entities/multiplayer-session.schema";
import { HostSessionDetailsReadModel, PlayerRanking, QuestionAnalysis } from "src/reports/application/queries/read-models/host.session.details.read.model";
import { PlayerSessionDetailsReadModel, QuestionResult } from "src/reports/application/queries/read-models/player.session.details.read.model";
import { GameType, UserResult } from "src/reports/application/queries/read-models/user.report.detailts.read.model";

export class MultiplayerSessionMongoMapper implements MultiplayerSessionMapper<MultiplayerSessionMongo, HostSessionDetailsReadModel, (PlayerSessionDetailsReadModel | null), UserResult> {

    public mapHostDetails(session: MultiplayerSessionMongo): HostSessionDetailsReadModel {
        
        // 1. Crear un mapa de aciertos por jugador (Paso previo ultra eficiente)
        // Clave: playerId, Valor: cantidad de respuestas correctas
        const correctAnswersCountMap = new Map<string, number>();

        session.slideResults.forEach(slide => {
            slide.submissions.forEach(submission => {
                if (submission.isAnswerCorrect) {
                    const currentCount = correctAnswersCountMap.get(submission.playerId) ?? 0;
                    correctAnswersCountMap.set(submission.playerId, currentCount + 1);
                }
            });
        });

        // 2. Transformar Ranking usando el mapa que acabamos de crear
        const playerRanking: PlayerRanking[] = session.ranking.map(entry => {
            return {
                position: entry.rank,
                username: entry.nickname,
                score: entry.score,
                // Consultamos el mapa. Si no aparece, es que tuvo 0 aciertos.
                correctAnswers: correctAnswersCountMap.get(entry.playerId) ?? 0
            };
        });

        // 3. Transformar Análisis de Preguntas (Este se mantiene igual)
        const questionAnalysis: QuestionAnalysis[] = session.slideResults.map(slide => {
            const totalAnswers = slide.submissions.length;
            const correctOnes = slide.submissions.filter(s => s.isAnswerCorrect).length;
            
            return {
                questionIndex: slide.slidePosition,
                questionText: slide.questionData.questionText,
                correctPercentage: totalAnswers > 0 ? (correctOnes / totalAnswers) * 100 : 0
            };
        });

        return new HostSessionDetailsReadModel(
            session.sessionId,
            session.kahootTitle ?? 'Kahoot sin título (Histórico)',
            session.timeDetails.startedAt.toISOString(),
            playerRanking,
            questionAnalysis
        );
    }

  public mapPlayerDetails(session: MultiplayerSessionMongo, playerId: string): PlayerSessionDetailsReadModel | null {
    const rankingEntry = session.ranking.find(r => r.playerId === playerId);
    if (!rankingEntry) return null;

    const questionResults: QuestionResult[] = session.slideResults.map(slide => {
      const playerSub = slide.submissions.find(s => s.playerId === playerId);
      return new QuestionResult(
        slide.slidePosition,
        slide.questionData.questionText,
        playerSub?.isAnswerCorrect ?? false,
        playerSub?.answerSelected.filter(a => a.answerContent.type === 'TEXT').map(a => a.answerContent.value) ?? [],
        playerSub?.answerSelected.filter(a => a.answerContent.type === 'IMAGE').map(a => a.answerContent.value) ?? [],
        Math.round((playerSub?.timeElapsed ?? 0) * 100) / 100
      );
    });

    const correctCount = questionResults.filter(q => q.isCorrect).length;
    const avgTime = questionResults.reduce((acc, curr) => acc + curr.timeTakenMs, 0) / (questionResults.length || 1);

    return new PlayerSessionDetailsReadModel(
      session.kahootId,
      session.kahootTitle  ?? 'Kahoot sin título (Histórico)',
      playerId,
      rankingEntry.score,
      correctCount,
      session.slideResults.length,
      Math.round(avgTime),
      rankingEntry.rank,
      questionResults
    );
  }

  public mapUserDetails(session: MultiplayerSessionMongo, userId: string): UserResult {
    const playerInRanking = session.ranking.find(r => r.playerId === userId);
    return {
      kahootId: session.kahootId,
      gameId: session.sessionId,
      gameType: GameType.MULTIPLAYER,
      title: session.kahootTitle  ?? 'Kahoot sin título (Histórico)',
      completionDate: session.timeDetails.completedAt,
      finalScore: playerInRanking?.score ?? 0,
      rankingPosition: playerInRanking?.rank ?? 0
    };
  }
}
