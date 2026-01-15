/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { DbPostgresEntity } from '../../registries/db-model-postgres.registry';

const ENTITY_NAME = 'notifications';

@DbPostgresEntity(ENTITY_NAME)
@Entity('notifications')
export class NotificationEntity {
    @PrimaryColumn('uuid', { name: 'notification_id' })
    @Index({ unique: true })
    notificationId: string;

    @Column('uuid', { name: 'user_id' })
    @Index()
    userId: string;

    @Column()
    type: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    body: string;

    @Column({ type: 'uuid', nullable: true, name: 'resource_id' })
    resourceId?: string;

    @Column({ type: 'boolean', default: false, name: 'is_read' })
    isRead: boolean;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;
}
