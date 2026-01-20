/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\backoffice\application\queries\ports\backoffice.dao.port.ts

import { Either, ErrorData } from 'src/core/types';
import { GetBackofficeUsersQuery } from '../get-backoffice-users/get-backoffice-users.query';
import { BackOfficeUserPaginationReadModel } from '../../read-model/backoffice-user.read.model';
import { GetMassNotificationsQuery } from '../get-mass-notifications/get-mass-notificactions.query';
import {
  BackofficeNotificationPaginationReadModel,
  UserForNotification,
  UserNotificationFilter,
} from '../../read-model/backoffice-notifications.read.model';

export interface IBackofficeDao {
  getBackofficeUsers(
    query: GetBackofficeUsersQuery,
  ): Promise<Either<ErrorData, BackOfficeUserPaginationReadModel>>;

  getMassNotifications(
    query: GetMassNotificationsQuery,
  ): Promise<Either<ErrorData, BackofficeNotificationPaginationReadModel>>;

  verifyIfUserIsAdmin(userId: string): Promise<Either<ErrorData, boolean>>;

  getUsersForNotification(
    filter: UserNotificationFilter,
  ): Promise<Either<ErrorData, UserForNotification[]>>;
}
