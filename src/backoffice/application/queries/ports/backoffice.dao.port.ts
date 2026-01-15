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
