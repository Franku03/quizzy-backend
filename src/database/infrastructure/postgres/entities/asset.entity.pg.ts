// src/media/infrastructure/entities/asset-metadata.entity.pg.ts

import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
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