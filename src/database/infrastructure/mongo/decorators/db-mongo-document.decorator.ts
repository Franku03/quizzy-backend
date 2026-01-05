import {
  DbModelMongoRegistry,
  DocumentConstructor,
} from '../registries/db-model-mongo.registry';

export function DbMongoDocument(key: string) {
  return function (target: DocumentConstructor) {
    DbModelMongoRegistry.registerModel(key, target);
    return target;
  };
}
