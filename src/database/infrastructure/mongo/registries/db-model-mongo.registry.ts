// src/database/registries/db-model.mongo.registry.ts
import { Schema } from 'mongoose';

export type DocumentConstructor<T = any> = new (...args: any[]) => T;

export type MongoModelRegistration<T = any> = {
  key: string;
  model?: new (...args: any[]) => T;
  schema?: Schema;
};

export class DbModelMongoRegistry {
  private static readonly registrations: Map<string, MongoModelRegistration> =
    new Map();

  static registerModel(key: string, model: DocumentConstructor) {
    const existing = this.registrations.get(key) ?? { key };
    existing.model = model;
    this.registrations.set(key, existing);
  }

  static registerSchema(key: string, schema: Schema) {
    const existing = this.registrations.get(key) ?? { key };
    existing.schema = schema;
    this.registrations.set(key, existing);
  }

  static getRegistrations(): MongoModelRegistration[] {
    return Array.from(this.registrations.values());
  }

  static clear() {
    this.registrations.clear();
  }
}
