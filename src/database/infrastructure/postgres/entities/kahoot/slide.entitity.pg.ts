import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { KahootEntity } from './kahoot.entity.pg';
import { OptionEntity } from './option.entity.pg';
import { DbPostgresEntity } from '../../decorators/db-postgres-entity.decorator';

const ENTITY_NAME = 'slides';

@DbPostgresEntity(ENTITY_NAME)
@Entity('slides')
export class SlideEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  kahootId: string;

  @Column('int')
  position: number;

  @Column()
  slideType: string;

  @Column('int')
  timeLimitSeconds: number;

  @Column({ type: 'text', nullable: true })
  questionText: string;

  @Column({ nullable: true })
  slideImageId: string;

  @Column({ type: 'int', nullable: true })
  pointsValue: number;

  @Column({ type: 'text', nullable: true })
  descriptionText: string;

  // Relaciones
  @ManyToOne(() => KahootEntity, (kahoot) => kahoot.slides)
  @JoinColumn({ name: 'kahootId' })
  kahoot: KahootEntity;

  @OneToMany(() => OptionEntity, (option) => option.slide, { cascade: true })
  options: OptionEntity[];
}