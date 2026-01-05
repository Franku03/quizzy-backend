import { RepositoryConstructor } from '../../class-constructors/repository.constructor';
import { RepositoryMongoRegistry } from '../registries/repository-mongo.registry';

export function RepositoryMongo(key: string) {
  return function (target: RepositoryConstructor) {
    RepositoryMongoRegistry.register(key, target);
    return target;
  };
}
