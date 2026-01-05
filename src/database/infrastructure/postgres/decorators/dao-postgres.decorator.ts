import { DaoConstructor } from '../../class-constructors/dao.constructor';
import { DaoPostgresRegistry } from '../registries/dao-postgres.registry';

export function DaoPostgres(key: string) {
  return function (target: DaoConstructor) {
    DaoPostgresRegistry.register(key, target);
    return target;
  };
}
