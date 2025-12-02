import { ValueObject } from '../../abstractions/value.object';

const ISO_8601_DATE_REGEX = /^(?:\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

interface DateISOProps {
  value: string;
}

export class DateISO extends ValueObject<DateISOProps> {
  private constructor(iso_8601_date: string) {
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

  //si necesitas generar una fecha con un string
  public static createFrom(iso_8601_Date: string): DateISO {
    return new DateISO(iso_8601_Date);
  }

  //para generar una fecha actual
  public static generate(): DateISO {
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    return new DateISO(isoDate);
  }

  //para comparar dos dates
  public isGreaterThan(other: DateISO): boolean {
    const thisDate = new globalThis.Date(this.properties.value);
    const otherDate = new globalThis.Date(other.getProperties().value);
    return thisDate.getTime() > otherDate.getTime();
  }

  public equals(date: DateISO): boolean {
    return super.equals(date);
  }

  public get value(): string {
    return this.properties.value;
  }
}
