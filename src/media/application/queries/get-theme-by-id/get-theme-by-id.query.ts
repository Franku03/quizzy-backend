// src/media/application/queries/get-theme-by-id/get-theme-by-id.query.ts
import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetThemeByIdQuery implements IQuery {
  constructor(public readonly assetId: string) {}
}