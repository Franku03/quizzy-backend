import { ValueObject } from '../../abstractions/value.object';

const ISO_8601_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface DateProps {
  value: string;
}

export class Date extends ValueObject<DateProps> {
  public constructor(iso_8601_date: string) {
    if (!iso_8601_date || iso_8601_date.trim().length === 0) {
      throw new Error('La fecha no puede ser nula o vacía.');
    }
    if (!ISO_8601_DATE_REGEX.test(iso_8601_date)) {
      throw new Error(
        `[Date Error]: la fecha '${iso_8601_date}' no es un formato ISO 8601 válido.`,
      );
    }
    super({ value: iso_8601_date });
  }

  public equals(date: Date): boolean {
    return super.equals(date);
  }

  public get value(): string {
    return this.properties.value;
  }
}
