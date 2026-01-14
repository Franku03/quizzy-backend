/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\entities\users.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { DbPostgresEntity } from '../decorators/db-postgres-entity.decorator';

const ENTITY_NAME = 'user';

@DbPostgresEntity(ENTITY_NAME)
@Entity('User')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
