// src/kahoots/application/services/kahoot-response.service.ts
import { Inject, Injectable } from '@nestjs/common';
import type { IKahootMapper } from '../ports/i-kahoot-mapper.port';
import { Kahoot } from '../../domain/aggregates/kahoot';
import { KahootSnapshot } from 'src/core/domain/snapshots/snpapshot.kahoot';
import { KahootHandlerResponse } from '../response/kahoot.handler.response';

/*Este servicio es usado como boilerplate, basicamente permite construir el kahoot (Aggregate)
  Puede convertir uno o varios kahoots mediante el metodo respectivo, lo unico que hace es mappear el aggregate al json de response
*/
@Injectable()
export class KahootResponseService {
  constructor(
    @Inject('IKahootMapper')
    private readonly kahootMapper: IKahootMapper
  ) {}

  public async toResponse(kahoot: Kahoot): Promise<KahootHandlerResponse> {
    return this.kahootMapper.fromSnapshot(kahoot.getSnapshot());
  }

  public async toResponseBatch(kahoots: Kahoot[]): Promise<KahootHandlerResponse[]> {
    return Promise.all(kahoots.map(k => this.toResponse(k)));
  }
}