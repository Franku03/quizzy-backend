/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\entities\kahoot\slide.entitity.pg.ts

import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
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
  @ManyToOne(() => KahootEntity, (kahoot) => kahoot.slides, {
    onDelete: 'CASCADE', // Si se borra el Kahoot, desaparecen las slides
    nullable: false, // PROHIBE que TypeORM ponga kahootId en NULL durante el UPDATE
  })
  @JoinColumn({ name: 'kahootId' })
  kahoot: KahootEntity;

  @OneToMany(() => OptionEntity, (option) => option.slide, { cascade: true })
  options: OptionEntity[];
}
