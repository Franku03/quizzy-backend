/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\entities\users.entity.ts

import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DbPostgresEntity } from '../decorators/db-postgres-entity.decorator';

const ENTITY_NAME = 'user'; 

@DbPostgresEntity(ENTITY_NAME)
@Entity('User') 
export class UserEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'profile_name' })
  profileName: string;

  @Column({ name: 'profile_description', nullable: true })
  profileDescription: string;

  @Column({ name: 'avatar_asset_id', nullable: true })
  avatarAssetId: string;

  @Column()
  type: string;

  @Column()
  state: string;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ name: 'deleted_hash', nullable: true, type: 'text' })
  deletedHash: string | null;

  @Column({ type: 'jsonb' })
  subscription: {
      state: string;
      plan: string;
      expiresAt: string;
  };

  @Column({ type: 'jsonb', default: {} })
  preferences: {
      theme: string;
  };

  @Column({ type: 'jsonb', default: [] })
  roles: string[];

  @Column({ type: 'jsonb', default: [] })
  favorites: string[]; 

  @Column({ name: 'last_username_update', nullable: true, type: 'text' })
  lastUsernameUpdate: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}