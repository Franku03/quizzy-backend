import { ValueObject } from './value.object';

const UUID_V4_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

export abstract class UuidVO extends ValueObject<{ value: string }> {

    public get value(): string {
        return this.properties.value;
    }

    protected constructor(id: string) {
        
        if (!id || id.trim().length === 0) {
            throw new Error("El ID no puede ser nulo o vacío.");
        }
        if (!UUID_V4_REGEX.test(id)) {
            throw new Error(`[ID Error]: El ID '${id}' no es un formato UUID V4 válido.`);
        }
        super({ value: id });
    }
    

    public equals(vo?: UuidVO): boolean {
        return super.equals(vo);
    }
}