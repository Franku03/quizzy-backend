import { ValueObject } from '../../abstractions/value.object';

const ISO_8601_DATE_REGEX = /^(?:\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

interface DateISOProps {
  value: string;
}

export class DateISO extends ValueObject<DateISOProps> {
  private constructor(iso_8601_date: any) {
    // Verificar si no es una cadena de texto (incluye null y undefined)
    if (typeof iso_8601_date !== 'string') {
        throw new Error('La fecha debe ser proporcionada como una cadena de texto.');
    }

    // El código original modificado para usar la variable segura
    const dateString = iso_8601_date as string; // Ahora podemos tratarla como string

    if (!dateString || dateString.trim().length === 0) {
        throw new Error('La fecha no puede ser nula o vacía.');
    }
    
    // Si llega aquí, es una cadena no vacía.
    if (!ISO_8601_DATE_REGEX.test(dateString)) {
        throw new Error(
            `[Date Error]: la fecha '${dateString}' no es un formato ISO 8601 válido.`,
        );
    }
    
    super({ value: dateString });
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
