import {
  DbModelPostgresRegistry,
  EntityConstructor,
} from '../registries/db-model-postgres.registry';

export function DbPostgresEntity(key: string) {
  return function (target: EntityConstructor) {
    DbModelPostgresRegistry.registerEntity(key, target);
    return target;
  };
}
