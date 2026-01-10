/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\entities\kahoot\option.entity.pg.ts

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