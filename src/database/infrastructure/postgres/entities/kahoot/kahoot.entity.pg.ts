import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
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
  @OneToMany(() => SlideEntity, (slide) => slide.kahoot, { cascade: true })
  slides: SlideEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}