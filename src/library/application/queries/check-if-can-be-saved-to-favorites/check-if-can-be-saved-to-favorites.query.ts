import { IQuery } from 'src/core/application/cqrs/query.interface';

export class CheckIfCanBeSavedToFavoritesQuery implements IQuery {
  constructor(public readonly kahootId: string) {}
}
