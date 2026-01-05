import { RepositoryConstructor } from '../../class-constructors/repository.constructor';

export class RepositoryPostgresRegistry {
  private static readonly registrations: Map<string, RepositoryConstructor> =
    new Map();

  static register(key: string, repoClass: RepositoryConstructor) {
    this.registrations.set(key, repoClass);
  }

  static get(key: string): RepositoryConstructor | undefined {
    return this.registrations.get(key);
  }
}
