import { Either, ErrorData } from 'src/core/types';
import { MassMessage } from '../aggregates/mass.message';

export interface ISendNotificationService {
  execute(userId: MassMessage): Promise<Either<ErrorData, void>>;
}
