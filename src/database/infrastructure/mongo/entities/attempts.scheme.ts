// attempt.schema.ts (Persistence Structure)

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';

// ---------------------------------------------------------
// 2. Sub-Schemas (Snapshots)
// ---------------------------------------------------------

const AnswerSelectedSchema = {
  isCorrect: { type: Boolean, required: true },
  // Discriminated Union implementation
  answerContent: {
    _type: { 
      type: String, 
      required: true, 
      enum: ['IMAGE', 'TEXT'] 
    },
    value: { type: String, required: true }
  }
};

const QuestionSnapshotSchema = {
  questionText: { type: String, required: true },
  basePoints: { 
    type: Number, 
    required: true,
  },
  timeLimit: { 
    type: Number, 
    required: true,
  }
};

const PlayerAnswerSchema = {
  slideId: { type: String, required: true },
  slidePosition: { type: Number, required: true },
  answerIndex: { type: [Number], required: true },
  isAnswerCorrect: { type: Boolean, required: true },
  
  // Flattened Value Objects (Score & ResponseTime)
  earnedScore: { type: Number, required: true }, 
  timeElapsed: { type: Number, required: true }, 
  
  answerContent: { type: [AnswerSelectedSchema], default: [] },
  questionSnapshot: { type: QuestionSnapshotSchema, required: true }
};

const AttemptProgressSchema = {
  totalQuestions: { type: Number, required: true },
  questionsAnswered: { type: Number, required: true }
};

const AttemptTimeDetailsSchema = {
  startedAt: { type: Date, required: true },
  lastPlayedAt: { type: Date, required: true },
  completedAt: { type: Date, default: null }
};

// ---------------------------------------------------------
// 3. Main Aggregate Schema
// ---------------------------------------------------------

@Schema({
  collection: 'attempts',
  timestamps: false, // We use our own timeDetails
})
export class AttemptMongo extends Document {
  
  // Domain ID
  @Prop({ required: true, unique: true, index: true })
  declare id: string; 

  @Prop({ required: true, index: true })
  public kahootId: string;

  @Prop({ required: true, index: true })
  public playerId: string;

  @Prop({ 
    required: true, 
    type: String, 
    enum: AttemptStatusEnum,
    default: AttemptStatusEnum.IN_PROGRESS 
  })
  public status: AttemptStatusEnum;

  @Prop({ required: true, default: 0 })
  public totalScore: number; 

  @Prop({ type: AttemptProgressSchema, required: true })
  public progress: {
    totalQuestions: number;
    questionsAnswered: number;
  };

  @Prop({ type: AttemptTimeDetailsSchema, required: true })
  public timeDetails: {
    startedAt: Date;
    lastPlayedAt: Date;
    completedAt: Date | null;
  };

  @Prop({ type: [PlayerAnswerSchema], default: [] })
  public answers: Array<{
    slideId: string;
    slidePosition: number;
    answerIndex: number[];
    isAnswerCorrect: boolean;
    earnedScore: number;
    timeElapsed: number;
    answerContent: Array<{
      isCorrect: boolean;
      answerContent: {
        _type: 'IMAGE' | 'TEXT';
        value: string;
      };
    }>;
    questionSnapshot: {
      questionText: string;
      basePoints: number;
      timeLimit: number;
    };
  }>;
}

export const AttemptSchema = SchemaFactory.createForClass(AttemptMongo);

// ---------------------------------------------------------
// 4. Indexes for Performance
// ---------------------------------------------------------

// "Get all attempts for a specific player in a specific kahoot"
AttemptSchema.index({ playerId: 1, kahootId: 1 });

// "Get leaderboard/history: Sort by date within a status"
AttemptSchema.index({ status: 1, lastPlayedAt: -1 });

// "Get all active attempts for a kahoot"
AttemptSchema.index({ kahootId: 1, status: 1 });