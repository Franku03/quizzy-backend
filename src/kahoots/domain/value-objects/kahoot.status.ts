import { ValueObject } from "src/core/domain/abstractions/value.object";

export enum KahootStatusEnum {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED"
}

interface KahootStatusProps {
    readonly value: KahootStatusEnum;
}

export class KahootStatus extends ValueObject<KahootStatusProps> {
    
    public constructor(status: KahootStatusEnum) {
        if (!Object.values(KahootStatusEnum).includes(status)) {
            throw new Error(`El valor de estado de Kahoot '${status}' no es válido.`);
        }
        super({ value: status });
    }
    
    public get value(): KahootStatusEnum {return this.properties.value;}
}