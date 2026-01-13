/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\entities\multiplayer-session.schema.ts

// multiplayer-session.schema.ts (Persistence Structure)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DbMongoDocument } from '../decorators/db-mongo-document.decorator';
import { DbMongoSchema } from '../decorators/db-mongo-schema.decorator';

// Database Collection Name
const COLLECTION_NAME: string = 'multiplayer_sessions';

// ---------------------------------------------------------
// 2. Value Object Sub-Schemas
// ---------------------------------------------------------


const OptionsSnapshotSchema = {

  index: { type: Number, required: true, min: 0 },
  type: { type: String, required: true },
  value: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },

}

const QuestionSnapshotSchema = {

  questionText: { type: String, required: true },
  basePoints: {
    type: Number,
    required: true,
    min: 0,
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 0,
  },
  optionsContent: { type: [OptionsSnapshotSchema], required: true, default: []}

};

const ScoreboardEntrySchema = {
  playerId: { type: String, required: true },
  nickname: { type: String, required: true },
  score: { type: Number, required: true, min: 0 },
  rank: { type: Number, required: true, min: 1 },
};

const PlayerSchema = {
  playerId: { type: String, required: true },
  nickname: { type: String, required: true },
  score: { type: Number, required: true, default: 0, min: 0 },
  isGuest: { type: Boolean, required: true, default: false },
  answersSubmitted: { type: Number, required: true, default: 0, min: 0 },
};


const AnswerSelectedSchema = {
  answerIndex: { type: Number, required: true, min: 0},
  isCorrect: { type: Boolean, required: true },
  answerContent: {
    type: {
      type: String,
      required: true,
    },
    value: { type: String, required: true },
  },
};


const SessionPlayerAnswerSchema = {
  playerId: { type: String, required: true },
  slideId: { type: String, required: true },
  earnedScore: { type: Number, required: true, min: 0 },
  timeElapsed: { type: Number, required: true, min: 0 },
  submittedAt: { type: Date, required: true, default: Date.now },
  isAnswerCorrect: { type: Boolean, required: true },
  answerSelected: {
    type: [AnswerSelectedSchema],
    default: [],
  },
};

const SlideResultSchema = {
  slideId: { type: String, required: true },
  slidePosition: { type: Number, required: true, min: 0 },
  numberOfSubmissions: { type: Number, required: true, min: 0 },
  questionData: { type: QuestionSnapshotSchema, required: true }, // Es required porque requerimos el snapshot de la slide para el modulo de reportes
  submissions: { type: [SessionPlayerAnswerSchema], default: [] }, // no es required porque pueden haber slideResults sin respuestas suministradas
};

const SessionProgressSchema = {

  lastSlidePlayedId: { type: String, required: true },
  totalSlidesPlayed: { type: Number, required: true, min: 1 },
  
};

const TimeDetailsSchema = {
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, required: true },
};

// ---------------------------------------------------------
// 3. Main Aggregate Schema
// ---------------------------------------------------------

@DbMongoDocument(COLLECTION_NAME)
@Schema({
  collection: COLLECTION_NAME,
  timestamps: false,
  toJSON: {
    virtuals: false,
    transform: (doc, ret) => {
      const { _id, __v, ...rest } = ret;
      return {
        id: _id?.toString(),
        ...rest,
      };
    },
  },
})
export class MultiplayerSessionMongo extends Document {
  @Prop({ required: true, unique: true, index: true })
  declare sessionId: string;

  @Prop({ required: true, index: true })
  public hostId: string;

  @Prop({ required: true, index: true }) // Para obtener el título en futuras consultas, otra técnica sería guardar directamente el título en el documento
  public kahootId: string;

  @Prop({ 
    required: true, 
    default: 'Título no disponible (Sesión antigua)' 
  })
  public kahootTitle: string;

  @Prop({
    required: true,
    unique: false, // Varias sesiones pueden tener el mismo pin
    index: true,
    match: /^\d{6,10}$/,
  })
  public sessionPin: string;

  @Prop({ required: true, type: TimeDetailsSchema })
  public timeDetails: {
    startedAt: Date;
    completedAt: Date;
  };

  @Prop({
    type: [ScoreboardEntrySchema],
    default: [],
  })
  public ranking: Array<{
    playerId: string;
    nickname: string;
    score: number;
    rank: number;
  }>;

  @Prop({
    type: [PlayerSchema],
    default: [],
  })
  public players: Array<{
    playerId: string;
    nickname: string;
    score: number;
    isGuest: boolean;
    answersSubmitted: number;
  }>;


  
  @Prop({
    type: SessionProgressSchema,
    required: true,
  })
  public totalProgress: {
    lastSlidePlayedId: string | null;
    totalSlidesPlayed: number;
  };


  @Prop({
    type: [SlideResultSchema],
    default: [],
  })
  public slideResults: Array<{
    slideId: string;
    slidePosition: number;
    numberOfSubmissions: number;
    questionData: {
      questionText: string;
      basePoints: number;
      timeLimit: number;
      optionsContent: Array<{
        index: number;
        type: string;
        value: string;
        isCorrect: boolean;
      }>;
    };
    submissions: Array<{
      playerId: string;
      slideId: string;
      isAnswerCorrect: boolean;
      earnedScore: number;
      timeElapsed: number;
      answerSelected: Array<{
        answerIndex: number;
        isCorrect: boolean;
        answerContent: {
          type: string;
          value: string;
        };
      }>;
    }>;
  }>;

  @Prop({ type: Number, default: 1 })
  public version: number;
}

export const MultiplayerSessionSchema = SchemaFactory.createForClass(
  MultiplayerSessionMongo,
);

// ---------------------------------------------------------
// 4. Indexes
// ---------------------------------------------------------

MultiplayerSessionSchema.index({ state: 1, 'timeDetails.completedAt': 1 });
MultiplayerSessionSchema.index({ sessionPin: 1, state: 1 });
MultiplayerSessionSchema.index({ hostId: 1, 'timeDetails.startedAt': -1 });
MultiplayerSessionSchema.index({ 'players.playerId': 1 });
MultiplayerSessionSchema.index({ 'slideResults.submissions.playerId': 1 });
MultiplayerSessionSchema.index({ 'ranking.score': -1 });

// ---------------------------------------------------------
// 5. Pre-save middleware
// ---------------------------------------------------------

MultiplayerSessionSchema.pre('save', function (next) {
  const session = this as any;

  if (session.isModified()) {
    session.version = (session.version || 1) + 1;
  }

  next();
});

//-----

DbMongoSchema(COLLECTION_NAME)(MultiplayerSessionSchema);
