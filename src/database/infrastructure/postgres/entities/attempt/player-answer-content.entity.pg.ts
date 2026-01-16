// File: src/database/infrastructure/postgres/entities/attempts/player-answer-content.entity.pg.ts

import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  JoinColumn,
  Index 
} from 'typeorm';
import { PlayerAnswerEntity } from './player-answer.entity.pg';
import { DbPostgresEntity } from '../../decorators/db-postgres-entity.decorator';

const ENTITY_NAME = 'player_answer_contents';

@DbPostgresEntity(ENTITY_NAME)
@Entity('player_answer_contents')
@Index('idx_answer_content_type', ['playerAnswerId', 'contentType'])
export class PlayerAnswerContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'player_answer_id' })
  playerAnswerId: string;

  @Column({ type: 'boolean', name: 'is_correct' })
  isCorrect: boolean;

  // Maps to the Mongo discriminated union: _type: 'IMAGE' | 'TEXT'
  // Required for the 'getDetailedReport' method to format the output correctly.
  @Column({
    type: 'enum',
    enum: ['IMAGE', 'TEXT'],
    name: 'content_type'
  })
  contentType: string;

  // Stores either the Text String or the Image UUID
  @Column({ type: 'text' })
  value: string;

  // Relationships
  @ManyToOne(() => PlayerAnswerEntity, (answer) => answer.answerContents, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'player_answer_id' })
  playerAnswer: PlayerAnswerEntity;
}