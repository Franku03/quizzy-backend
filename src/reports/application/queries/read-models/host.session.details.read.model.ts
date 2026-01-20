

export interface PlayerRanking {
    position:       number;
    username:       string;
    score:          number;
    correctAnswers: number;
}

export interface QuestionAnalysis {
    questionIndex:     number;
    questionText:      string;
    correctPercentage: number;
}


export class HostSessionDetailsReadModel {
  constructor(
    public readonly sessionId: string,
    public readonly title: string,
    public readonly executionDate: string,
    public readonly playerRanking: PlayerRanking[],
    public readonly questionAnalysis: QuestionAnalysis[],
  ) {}
}