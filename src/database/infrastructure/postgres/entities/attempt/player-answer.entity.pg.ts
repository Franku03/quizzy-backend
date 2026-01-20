// File: src/database/infrastructure/postgres/entities/attempts/player-answer.entity.pg.ts

import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  OneToMany, 
  JoinColumn,
  Index 
} from 'typeorm';
import { AttemptEntity } from './attempt.entity.pg';
import { PlayerAnswerContentEntity } from './player-answer-content.entity.pg';
import { DbPostgresEntity } from '../../decorators/db-postgres-entity.decorator';

const ENTITY_NAME = 'player_answers';

@DbPostgresEntity(ENTITY_NAME)
@Entity('player_answers')
@Index('idx_player_answers_attempt_slide', ['attemptId', 'slidePosition'])
export class PlayerAnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'attempt_id' })
  attemptId: string;

  @Column({ type: 'uuid', name: 'slide_id' })
  slideId: string;

  @Column({ type: 'int', name: 'slide_position' })
  slidePosition: number;

  @Column({ 
    type: 'int', 
    array: true, 
    name: 'answer_index',
    default: '{}' 
  })
  answerIndex: number[];

  @Column({ type: 'boolean', name: 'is_answer_correct' })
  isAnswerCorrect: boolean;

  // Flattened Score and ResponseTime Value Objects
  @Column({ type: 'int', name: 'earned_score' })
  earnedScore: number;

  @Column({ type: 'int', name: 'time_elapsed' })
  timeElapsed: number;

  // QuestionSnapshot Value Object flattened
  @Column({ type: 'text', name: 'snapshot_question_text' })
  snapshotQuestionText: string;

  @Column({ type: 'int', name: 'snapshot_base_points' })
  snapshotBasePoints: number;

  @Column({ type: 'int', name: 'snapshot_time_limit' })
  snapshotTimeLimit: number;

  // Relationships
  @ManyToOne(() => AttemptEntity, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'attempt_id' })
  attempt: AttemptEntity;

  @OneToMany(() => PlayerAnswerContentEntity, (content) => content.playerAnswer, {
    cascade: true,
    eager: false,
  })
  answerContents: PlayerAnswerContentEntity[];
}