/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDeviceRepository } from 'src/notifications/domain/ports/device.repository.port';
import { NotificationDeviceEntity } from '../../entities/devices/notification-device.entity.pg';
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { IdGenerator } from 'src/core/application/ports/idgenerator/i-id-generator.interface';

@RepositoryPostgres(RepositoryName.Device)
@Injectable()
export class DeviceRepository implements IDeviceRepository {
    constructor(
        @InjectRepository(NotificationDeviceEntity)
        private readonly deviceRepository: Repository<NotificationDeviceEntity>,
        @Inject(APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR)
        private readonly idGenerator: IdGenerator<string>,
    ) { }

    async register(userId: string, token: string, deviceType: string): Promise<void> {
        const existingDevice = await this.deviceRepository.findOne({
            where: { userId, token }
        });

        if (existingDevice) {
            await this.deviceRepository.update(
                { deviceId: existingDevice.deviceId },
                { deviceType, updatedAt: new Date() }
            );
        } else {
            const deviceId = await this.idGenerator.generateId();
            const entity = this.deviceRepository.create({
                deviceId,
                userId,
                token,
                deviceType,
                updatedAt: new Date(),
            });

            await this.deviceRepository.save(entity);
        }
    }

    async remove(userId: string, token: string): Promise<void> {
        await this.deviceRepository.delete({ userId, token });
    }

    async findTokensByUserId(userId: string): Promise<string[]> {
        const devices = await this.deviceRepository.find({
            where: { userId },
            select: ['token']
        });

        return devices.map(device => device.token);
    }
}
