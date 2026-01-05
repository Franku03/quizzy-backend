export type EntityConstructor<T = any> = new (...args: any[]) => T;

export type PostgresModelRegistration = {
  key: string;
  entity?: EntityConstructor;
};

export class DbModelPostgresRegistry {
  private static readonly registrations: Map<
    string,
    PostgresModelRegistration
  > = new Map();

  static registerEntity(key: string, entity: EntityConstructor) {
    const existing = this.registrations.get(key) ?? { key };
    existing.entity = entity;
    this.registrations.set(key, existing);
  }

  static getRegistrations(): PostgresModelRegistration[] {
    return Array.from(this.registrations.values());
  }

  static clear() {
    this.registrations.clear();
  }
}

// Decorador
export function DbPostgresEntity(key: string) {
  return function (target: EntityConstructor) {
    DbModelPostgresRegistry.registerEntity(key, target);
    return target;
  };
}
