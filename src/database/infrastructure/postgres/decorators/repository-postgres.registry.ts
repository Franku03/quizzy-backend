import { RepositoryConstructor } from '../../class-constructors/repository.constructor';
import { RepositoryPostgresRegistry } from '../registries/repository-postgres.registry';

export function RepositoryPostgres(key: string) {
  return function (target: RepositoryConstructor) {
    RepositoryPostgresRegistry.register(key, target);
    return target;
  };
}
