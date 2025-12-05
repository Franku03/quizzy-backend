// multiplayer-session.schema.ts (Persistence Structure)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// ---------------------------------------------------------
// 2. Value Object Sub-Schemas
// ---------------------------------------------------------

const AnswerSelectedSchema = {
  isCorrect: { type: Boolean, required: true },
  answerContent: {
    type: { 
      type: String, 
      required: true 
    },
    value: { type: String, required: true }
  }
};

const QuestionSnapshotSchema = {
  questionText: { type: String, required: true },
  basePoints: { 
    type: Number, 
    required: true,
    min: 0
  },
  timeLimit: { 
    type: Number, 
    required: true,
    min: 0
  },
  correctAnswerIndices: { 
    type: [Number], 
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length > 0,
      message: 'At least one correct answer index is required'
    }
  }
};

const ScoreboardEntrySchema = {
  playerId: { type: String, required: true },
  nickname: { type: String, required: true },
  score: { type: Number, required: true, min: 0 },
  rank: { type: Number, required: true, min: 1 },
  previousRank: { type: Number, required: true, min: 0 }
};

const PlayerSchema = {
  playerId: { type: String, required: true },
  nickname: { type: String, required: true },
  score: { type: Number, required: true, default: 0, min: 0 },
  isHost: { type: Boolean, required: true, default: false },
  joinedAt: { type: Date, required: true, default: Date.now }
};

const SessionPlayerAnswerSchema = {
  playerId: { type: String, required: true },
  slideId: { type: String, required: true },
  answerIndex: { 
    type: [Number], 
    required: true,
    validate: {
      validator: (arr: number[]) => arr.length > 0,
      message: 'At least one answer index is required'
    }
  },
  isAnswerCorrect: { type: Boolean, required: true },
  earnedScore: { type: Number, required: true, min: 0 },
  timeElapsed: { type: Number, required: true, min: 0 },
  submittedAt: { type: Date, required: true, default: Date.now },
  answerContent: { 
    type: [AnswerSelectedSchema], 
    default: []
  }
};

const SlideResultSchema = {
  slideId: { type: String, required: true },
  slidePosition: { type: Number, required: true, min: 0 },
  questionSnapshot: { type: QuestionSnapshotSchema, required: true },
  submissions: { type: [SessionPlayerAnswerSchema], default: [] },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, default: null }
};

const SessionProgressSchema = {
  currentSlideId: { type: String, default: null },
  currentQuestionStartTime: { type: Date, default: null },
  slideOrder: { 
    type: [String], 
    default: []
  },
  currentSlideIndex: { 
    type: Number, 
    default: 0,
    min: 0
  },
  totalSlides: { type: Number, required: true, min: 1 }
};

const TimeDetailsSchema = {
  startedAt: { type: Date, required: true },
  lastActivityAt: { type: Date, required: true },
  completedAt: { type: Date, default: null }
};

// ---------------------------------------------------------
// 3. Main Aggregate Schema
// ---------------------------------------------------------

@Schema({
  collection: 'multiplayer_sessions',
  timestamps: false,
  toJSON: {
    virtuals: false,
    transform: (doc, ret) => {
      const { _id, __v, ...rest } = ret;
      return {
        id: _id?.toString(),
        ...rest
      };
    }
  }
})
export class MultiplayerSessionMongo extends Document {
  
  @Prop({ required: true, unique: true, index: true })
  declare sessionId: string;

  @Prop({ required: true, index: true })
  public hostId: string;

  @Prop({ required: true, index: true })
  public kahootId: string;

  @Prop({ 
    required: true, 
    unique: true, 
    index: true,
    match: /^[0-9]{6}$/
  })
  public sessionPin: string;

  @Prop({ 
    required: true, 
    type: String,
    default: 'LOBBY',
    index: true
  })
  public state: string;

  @Prop({ required: true, type: TimeDetailsSchema })
  public timeDetails: {
    startedAt: Date;
    lastActivityAt: Date;
    completedAt: Date | null;
  };

  @Prop({ 
    type: SessionProgressSchema, 
    required: true
  })
  public progress: {
    currentSlideId: string | null;
    currentQuestionStartTime: Date | null;
    slideOrder: string[];
    currentSlideIndex: number;
    totalSlides: number;
  };

  @Prop({ 
    type: [ScoreboardEntrySchema], 
    default: []
  })
  public ranking: Array<{
    playerId: string;
    nickname: string;
    score: number;
    rank: number;
    previousRank: number;
  }>;

  @Prop({ 
    type: [PlayerSchema], 
    default: []
  })
  public players: Array<{
    playerId: string;
    nickname: string;
    score: number;
    isHost: boolean;
    joinedAt: Date;
  }>;

  @Prop({ 
    type: [SlideResultSchema], 
    default: []
  })
  public slideResults: Array<{
    slideId: string;
    slidePosition: number;
    questionSnapshot: {
      questionText: string;
      basePoints: number;
      timeLimit: number;
      correctAnswerIndices: number[];
    };
    submissions: Array<{
      playerId: string;
      slideId: string;
      answerIndex: number[];
      isAnswerCorrect: boolean;
      earnedScore: number;
      timeElapsed: number;
      submittedAt: Date;
      answerContent: Array<{
        isCorrect: boolean;
        answerContent: {
          type: string;
          value: string;
        };
      }>;
    }>;
    startedAt: Date;
    endedAt: Date | null;
  }>;

  @Prop({ type: Number, default: 1 })
  public version: number;
}

export const MultiplayerSessionSchema = SchemaFactory.createForClass(MultiplayerSessionMongo);

// ---------------------------------------------------------
// 4. Indexes
// ---------------------------------------------------------

MultiplayerSessionSchema.index({ state: 1, 'timeDetails.completedAt': 1 });
MultiplayerSessionSchema.index({ sessionPin: 1, state: 1 });
MultiplayerSessionSchema.index({ hostId: 1, 'timeDetails.startedAt': -1 });
MultiplayerSessionSchema.index({ 'players.playerId': 1 });
MultiplayerSessionSchema.index({ 'slideResults.submissions.playerId': 1 });
MultiplayerSessionSchema.index({ 'ranking.score': -1 });

MultiplayerSessionSchema.index({ 
  'timeDetails.lastActivityAt': 1, 
  state: 1 
});

// ---------------------------------------------------------
// 5. Pre-save middleware
// ---------------------------------------------------------

MultiplayerSessionSchema.pre('save', function(next) {
  const session = this as any;
  
  if (session.isModified()) {
    session.timeDetails.lastActivityAt = new Date();
    session.version = (session.version || 1) + 1;
  }
  
  next();
});