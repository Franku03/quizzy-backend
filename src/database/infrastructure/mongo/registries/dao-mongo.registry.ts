import { DaoConstructor } from '../../class-constructors/dao.constructor';

export class DaoMongoRegistry {
  private static readonly registrations: Map<string, DaoConstructor> =
    new Map();

  static register(key: string, daoClass: DaoConstructor) {
    this.registrations.set(key, daoClass);
  }

  static get(key: string): DaoConstructor | undefined {
    return this.registrations.get(key);
  }
}
