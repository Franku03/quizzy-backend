import { MultiplayerSessionEntity } from "../../../entities/multiplayer-session.entity.pg";
import { HostSessionDetailsReadModel, PlayerRanking, QuestionAnalysis } from "src/reports/application/queries/read-models/host.session.details.read.model";
import { PlayerSessionDetailsReadModel, QuestionResult } from "src/reports/application/queries/read-models/player.session.details.read.model";
import { GameType, UserResult } from "src/reports/application/queries/read-models/user.report.detailts.read.model";
import { MultiplayerSessionMapper } from "src/reports/application/ports/i-multiplayer-session-mapper";

export class MultiplayerSessionPgMapper implements MultiplayerSessionMapper<MultiplayerSessionEntity, HostSessionDetailsReadModel, (PlayerSessionDetailsReadModel | null), UserResult > {

  /**
   * Transforma una MultiplayerSessionEntity (Postgres) en un HostSessionDetailsReadModel (Aplicación)
   */
  public mapHostDetails(session: MultiplayerSessionEntity): HostSessionDetailsReadModel {

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

    // Transformar Análisis de Preguntas
    const questionAnalysis: QuestionAnalysis[] = session.slideResults.map(slide => {
        const totalAnswers = slide.submissions.length;
        const correctAnswers = slide.submissions.filter(s => s.isAnswerCorrect).length;
        
        return {
            questionIndex: slide.slidePosition,
            questionText: slide.questionData.questionText,
            correctPercentage: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
        };
    });

    const startedAt = new Date( session.timeDetails.startedAt )
    
    return new HostSessionDetailsReadModel(
        session.sessionId,
        session.kahoot?.title ?? 'Kahoot sin título',
        startedAt.toISOString(),
        playerRanking,
        questionAnalysis
    );

  }

  /**
   * Mapea la información disponible en la sesión sobre el jugador y su rendimiento
   */
  public mapPlayerDetails(session: MultiplayerSessionEntity, playerId: string ): PlayerSessionDetailsReadModel | null {
    
    const rankingEntry = session.ranking.find(r => r.playerId === playerId);

    if (!rankingEntry) return null ;

    // Extraer resultados de cada pregunta para este jugador
    const questionResults: QuestionResult[] = session.slideResults.map(slide => {
        const playerSub = slide.submissions.find(s => s.playerId === playerId);
        
        return new QuestionResult(
            // questionIndex:
             slide.slidePosition,
            //  questionText:
             slide.questionData.questionText,
            //  isCorrect: 
            playerSub?.isAnswerCorrect ?? false,
            // Mapeamos los textos o imágenes seleccionadas
            // answerText: 
            playerSub?.answerSelected
                            .filter(a => a.answerContent.type === 'TEXT')
                            .map(a => a.answerContent.value) ?? [],
            // answerMediaId: 
            playerSub?.answerSelected
                            .filter(a => a.answerContent.type === 'IMAGE')
                            .map(a => a.answerContent.value) ?? [],
            // timeTakenMs: 
            Math.round((playerSub?.timeElapsed ?? 0) * 100)/100
        );
    });

    const correctCount = questionResults.filter(q => q.isCorrect).length;
    const avgTime = questionResults.reduce((acc, curr) => acc + curr.timeTakenMs, 0) / (questionResults.length || 1);

    return new PlayerSessionDetailsReadModel(
        session.kahootId,
        session.kahoot?.title ?? 'Kahoot sin título',
        playerId,
        rankingEntry.score,
        correctCount,
        session.slideResults.length,
        Math.round(avgTime),
        rankingEntry.rank,
        questionResults
    )
  }

  /**
   * Mapea la información general del usuario en cuanto a sesiones multiplayer se refiere
   */
  public mapUserDetails(session: MultiplayerSessionEntity, userId: string): UserResult {

    const playerInRanking = session.ranking.find(r => r.playerId === userId);

    return {
        kahootId: session.kahootId,
        gameId: session.sessionId,
        gameType: GameType.MULTIPLAYER_HOST,
        title: session.kahoot?.title ?? 'Kahoot sin título',
        completionDate: session.timeDetails.completedAt,
        finalScore: playerInRanking?.score ?? 0,
        rankingPosition: playerInRanking?.rank ?? 0
    }
  }
}