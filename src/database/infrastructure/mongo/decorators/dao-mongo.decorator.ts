import { DaoConstructor } from '../../class-constructors/dao.constructor';
import { DaoMongoRegistry } from '../registries/dao-mongo.registry';

export function DaoMongo(key: string) {
  return function (target: DaoConstructor) {
    DaoMongoRegistry.register(key, target);
    return target;
  };
}
