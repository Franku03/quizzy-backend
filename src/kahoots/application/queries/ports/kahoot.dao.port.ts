import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import { OptionalRepositoryResult } from 'src/core/types/repository-result.type';

export interface IKahootDao {

  getKahootById(id: string): Promise<OptionalRepositoryResult<KahootHandlerResponse>>;
}