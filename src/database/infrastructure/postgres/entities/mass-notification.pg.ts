/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DbPostgresEntity } from '../registries/db-model-postgres.registry';
import { UserEntity } from './users.entity';

const ENTITY_NAME = 'mass_notifications';

@DbPostgresEntity(ENTITY_NAME)
@Entity('MassNotification')
export class MassNotificationEntity {
  @PrimaryColumn('uuid')
  massMessageId: string;

  @Column({ name: 'author_id' })
  authorId: string;

  // Contenido del mensaje (normalizado en columnas separadas)
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  // Filtros (booleanos separados)
  @Column({ name: 'send_to_admins', type: 'boolean' })
  sendToAdmins: boolean;

  @Column({ name: 'send_to_regular_users', type: 'boolean' })
  sendToRegularUsers: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relación con el usuario autor (opcional, para joins)
  @ManyToOne(() => UserEntity, (user) => user.id, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  author?: UserEntity;
}
