// File: src/database/infrastructure/postgres/entities/attempts/attempt.entity.pg.ts

import { 
  Entity, 
  Column, 
  PrimaryColumn, 
  OneToMany, 
  Index, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { PlayerAnswerEntity } from './player-answer.entity.pg';
import { DbPostgresEntity } from '../../decorators/db-postgres-entity.decorator';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';

const ENTITY_NAME = 'attempts';

@DbPostgresEntity(ENTITY_NAME)
@Entity('attempts')
// Optimized indexes for repository methods
@Index('idx_attempt_id_unique',['id'], { unique: true }) // For O(1) lookup
@Index('idx_inspect_attempt', ['playerId', 'kahootId', 'status'])
@Index('idx_resume_context', ['kahootId'])
@Index('idx_attempts_player_kahoot_status', ['playerId', 'kahootId', 'status'])
@Index('idx_attempts_kahoot_status', ['kahootId', 'status'])
@Index('idx_attempts_player_status_lastplayed', ['playerId', 'status', 'lastPlayedAt'])
export class AttemptEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  kahootId: string;

  @Column('uuid')
  playerId: string;

  @Column({
    type: 'enum',
    enum: AttemptStatusEnum,
    default: AttemptStatusEnum.IN_PROGRESS,
  })
  status: AttemptStatusEnum;

  @Column({ type: 'int', default: 0 })
  totalScore: number;

  // Optimization for getPerformanceSummary - maintained by application logic
  @Column({ type: 'int', default: 0 })
  correctAnswersCount: number;

  // Flattened AttemptProgress Value Object
  @Column({ type: 'int', name: 'total_questions' })
  totalQuestions: number;

  @Column({ type: 'int', name: 'questions_answered' })
  questionsAnswered: number;

  // Flattened AttemptTimeDetails Value Object
  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', name: 'last_played_at' })
  lastPlayedAt: Date;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null;

  // Relationships
  @OneToMany(() => PlayerAnswerEntity, (answer) => answer.attempt, {
    cascade: true,
    eager: false, // Don't auto-load for performance
  })
  answers: PlayerAnswerEntity[];

  // Infrastructure Audit Fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method for repository mapping
  getNextSlideIndex(): number {
    return this.questionsAnswered;
  }
}