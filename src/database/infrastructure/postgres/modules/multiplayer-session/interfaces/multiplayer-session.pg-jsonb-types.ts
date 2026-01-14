
export interface TimeDetails {
  startedAt: Date;
  completedAt: Date;
}

export interface SessionProgress {
  lastSlidePlayedId: string | null;
  totalSlidesPlayed: number;
}

export interface PlayerSnapshot {
  playerId: string;
  nickname: string;
  score: number;
  isGuest: boolean;
  answersSubmitted: number;
}

export interface ScoreboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
}

export interface OptionContent {
  index: number;
  type: string;
  value: string;
  isCorrect: boolean;
}

export interface QuestionSnapshot {
  questionText: string;
  basePoints: number;
  timeLimit: number;
  optionsContent: OptionContent[];
}

export interface AnswerSelected {
  answerIndex: number;
  isCorrect: boolean;
  answerContent: {
    type: string;
    value: string;
  };
}

export interface PlayerSubmission {
  playerId: string;
  slideId: string;
  earnedScore: number;
  timeElapsed: number;
  isAnswerCorrect: boolean;
  answerSelected: AnswerSelected[];
}

export interface SlideResult {
  slideId: string;
  slidePosition: number;
  numberOfSubmissions: number;
  questionData: QuestionSnapshot;
  submissions: PlayerSubmission[];
}