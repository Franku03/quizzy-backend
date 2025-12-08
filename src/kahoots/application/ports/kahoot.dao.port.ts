// src/kahoots/application/queries/ports/kahoot.dao.port.ts
import { KahootHandlerResponse } from '../response/kahoot.handler.response';
import { Either, ErrorData } from 'src/core/types'; 


export interface IKahootDao {
  getKahootById(id: string): Promise<Either<ErrorData, KahootHandlerResponse | null>>;
}
