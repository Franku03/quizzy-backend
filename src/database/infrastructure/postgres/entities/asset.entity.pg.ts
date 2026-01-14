/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\entities\asset.entity.pg.ts

import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { DbPostgresEntity } from '../registries/db-model-postgres.registry';

const ENTITY_NAME = 'asset_metadata';

@DbPostgresEntity(ENTITY_NAME)
@Entity('AssetMetadata')
export class AssetMetadataEntity {
  @PrimaryColumn('uuid')
  @Index({ unique: true })
  assetId: string;

  @Column()
  @Index({ unique: true })
  publicId: string;

  @Column({ default: 'cloudinary' })
  provider: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column('bigint')
  size: number;

  @Column()
  @Index({ unique: true })
  contentHash: string;

  @Column('int', { default: 1 })
  referenceCount: number;

  @Column()
  format: string;

  @Column()
  category: string;

  @Column({ default: false })
  theme: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  uploadedAt: Date;
}
