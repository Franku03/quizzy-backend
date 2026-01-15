import { Either, ErrorData } from 'src/core/types';
import { MassMessage } from '../aggregates/mass.message';

export interface IMassMessageRepository {
  save(message: MassMessage): Promise<Either<ErrorData, void>>;
}
