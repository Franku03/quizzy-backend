
import { Entity, Column, PrimaryColumn, Index, VersionColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { 
  TimeDetails, 
  SessionProgress, 
  PlayerSnapshot, 
  ScoreboardEntry, 
  SlideResult 
} from '../modules/multiplayer-session/interfaces/multiplayer-session.pg-jsonb-types'; 
import { DbPostgresEntity } from '../registries/db-model-postgres.registry';
import { KahootEntity } from './kahoot/kahoot.entity.pg';

const ENTITY_NAME = 'multiplayer_sessions';

@DbPostgresEntity(ENTITY_NAME)
@Entity('Multiplayer_Sessions')
@Index(['hostId', 'timeDetails']) 
@Index(['sessionPin'], { unique: false }) 
export class MultiplayerSessionEntity {
  
  @PrimaryColumn('uuid', { name: 'session_id' })
  sessionId: string;

  // -----------------------------------------------------
  // 1. Configuración de Foreign Key: HOST
  // -----------------------------------------------------
  
  // Definimos la columna explícita para tener acceso rápido al ID sin hacer JOIN
  @Column('uuid', { name: 'host_id' })
  hostId: string;

  // Definimos la relación para la integridad referencial (FK)
  // @ManyToOne(() => UserEntity, (user) => user.sessions) // Asumiendo que user tiene user.sessions
  // @JoinColumn({ name: 'host_id' }) // IMPORTANTE: Esto le dice a TypeORM que use la columna de arriba como FK
  // host: UserEntity;

  // -----------------------------------------------------
  // 2. Configuración de Foreign Key: KAHOOT
  // -----------------------------------------------------

  @Column('uuid', { name: 'kahoot_id' })
  kahootId: string;

  @ManyToOne(() => KahootEntity)
  @JoinColumn({ name: 'kahoot_id' })
  kahoot: KahootEntity;

  @Column({ name: 'session_pin', length: 10 })
  sessionPin: string;

  // --- ESTRUCTURAS COMPLEJAS (JSONB) ---


  @Column({
    type: 'jsonb',
    name: 'time_details',
    nullable: false,
  })
  timeDetails: TimeDetails;

  @Column({
    type: 'jsonb',
    name: 'total_progress',
    default: { lastSlidePlayedId: null, totalSlidesPlayed: 0 }
  })
  totalProgress: SessionProgress;

  @Index('idx_session_players_gin', { synchronize: false }) // Aquí le dices a TypeORM: "No intentes sincronizarlo tú"
  @Column({
    type: 'jsonb',
    default: [],
    comment: 'Snapshot of players connected to the session'
  })
  players: PlayerSnapshot[];

  @Column({
    type: 'jsonb',
    default: [],
    comment: "Ranking of players at the end of the session"
  })
  ranking: ScoreboardEntry[];

  @Column({
    type: 'jsonb',
    name: 'slide_results',
    default: [],
    comment: 'Complex structure storing all questions and answers history'
  })
  slideResults: SlideResult[];

  // --- METADATA ---

  @VersionColumn()
  version: number;
}