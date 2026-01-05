import { Schema } from 'mongoose';
import { DbModelMongoRegistry } from '../registries/db-model-mongo.registry';

export function DbMongoSchema(key: string) {
  return function (target: Schema) {
    DbModelMongoRegistry.registerSchema(key, target);
    return target;
  };
}
