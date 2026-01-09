import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { SlideEntity } from './slide.entitity.pg';
import { DbPostgresEntity } from '../../registries/db-model-postgres.registry';

const ENTITY_NAME = 'options';

@DbPostgresEntity(ENTITY_NAME)
@Entity('options')
export class OptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  slideId: string;

  @Column({ type: 'text', nullable: true })
  optionText: string;

  @Column('boolean')
  isCorrect: boolean;

  @Column({ nullable: true })
  optionImageId: string;

  @ManyToOne(() => SlideEntity, (slide) => slide.options, {
    onDelete: 'CASCADE',
    nullable: false, // Evita huérfanos durante el reemplazo de slides
  })
  @JoinColumn({ name: 'slideId' })
  slide: SlideEntity;
}