/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

import { Entity, Column, PrimaryColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { DbPostgresEntity } from '../../registries/db-model-postgres.registry';

const ENTITY_NAME = 'notification_devices';

@DbPostgresEntity(ENTITY_NAME)
@Entity('notification_devices')
@Unique(['userId', 'token'])
export class NotificationDeviceEntity {
    @PrimaryColumn('uuid', { name: 'device_id' })
    @Index({ unique: true })
    deviceId: string;

    @Column('uuid', { name: 'user_id' })
    @Index()
    userId: string;

    @Column({ type: 'text' })
    token: string;

    @Column({ type: 'varchar', name: 'device_type' })
    deviceType: string;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;
}
