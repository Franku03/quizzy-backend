// src/explore/application/queries/get-public-kahoots/get-public-kahoots.query.ts
import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetPublicKahootsQuery implements IQuery {
  // We define the properties that this query will carry to the handler.
  // These map directly to the filtering criteria supported by our domain.
  constructor(
    public readonly searchTerm?: string,
    public readonly categories?: string[],
    public readonly page?: number,
    public readonly limit?: number,
    public readonly orderBy?: 'createdAt' | 'title' | 'playCount',
    public readonly order?: 'asc' | 'desc',
  ) {}
}