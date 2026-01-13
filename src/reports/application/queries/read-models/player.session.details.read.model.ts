import { IHasMediaAssets } from "src/core/domain/abstractions/media.assets.interface";

export class QuestionResult implements IHasMediaAssets {

  constructor(
    public readonly questionIndex: number,
    public readonly questionText:  string,
    public readonly isCorrect:     boolean,
    public readonly answerText:    string[],
    public readonly answerMediaId: string[],
    public readonly timeTakenMs:   number,
  ){}


  getMediaAssetIds(): string[] {
    return Array.from(new Set(this.answerMediaId));
  }

  /** Inyecta las URLs finales una vez resueltas */
  applyMediaUrls(urlMap: Map<string, string>): void {
    for (let i = 0; i < this.answerMediaId.length; i++) {
      const currentId = this.answerMediaId[i];
      if (urlMap.has(currentId)) {
        this.answerMediaId[i] = urlMap.get(currentId)!;
      }
    }
  }
}

export class PlayerSessionDetailsReadModel implements IHasMediaAssets {
  constructor(
    public readonly kahootId:        string,
    public readonly title:           string,
    public readonly userId:          string,
    public readonly finalScore:      number,
    public readonly correctAnswers:  number,
    public readonly totalQuestions:  number,
    public readonly averageTimeMs:   number,
    public readonly rankingPosition: number,
    public readonly questionResults: QuestionResult[],
  ) {}

      /** Extrae todos los IDs de assets (IDs de MongoDB/UUIDs) */

      // Parece haber problemas acá
  getMediaAssetIds(): string[] {
    const allIds = new Set<string>();
    
    // Delegate to children (Encapsulation)
    this.questionResults.forEach( question => {
      question.getMediaAssetIds().forEach(id => allIds.add(id));
    });

    return Array.from(allIds);
  }

  /** Inyecta las URLs finales una vez resueltas */
  applyMediaUrls(urlMap: Map<string, string>): void {
    // Delegate to children
    this.questionResults.forEach(question => {
      question.applyMediaUrls(urlMap);
    });
  }

}