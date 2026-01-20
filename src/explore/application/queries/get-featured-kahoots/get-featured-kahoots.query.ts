// This is the query object for fetching featured kahoots.
// It encapsulates the parameters needed to retrieve a curated list of kahoots
// that are highlighted for users in the explore section of the platform.
import { IQuery } from 'src/core/application/cqrs/query.interface';

export class GetFeaturedKahootsQuery implements IQuery {
  constructor(public readonly limit?: number) {}
}