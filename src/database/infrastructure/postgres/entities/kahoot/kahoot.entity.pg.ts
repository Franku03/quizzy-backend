/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\entities\kahoot\kahoot.entity.pg.ts

import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SlideEntity } from './slide.entitity.pg';
import { DbPostgresEntity } from '../../registries/db-model-postgres.registry';

const ENTITY_NAME = 'kahoot';

@DbPostgresEntity(ENTITY_NAME)
@Entity('Kahoot')
export class KahootEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  authorId: string;

  // Detalles (Normalizados como columnas)
  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column()
  visibility: string;

  @Column()
  status: string;

  @Column({ default: 0 })
  playCount: number;

  // Estilo
  @Column()
  themeId: string;

  @Column({ nullable: true })
  coverImageId: string;

  // Relación: Un Kahoot tiene muchas diapositivas
  @OneToMany(() => SlideEntity, (slide) => slide.kahoot, {
    cascade: true, // Permite que repo.save(kahoot) cree/actualice slides
  })
  slides: SlideEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
