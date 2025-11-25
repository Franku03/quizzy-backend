import { ValueObject } from "src/core/domain/value.object";

enum VisibilityStatusEnum {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC"
}

interface VisibilityStatusProps {
    readonly value: VisibilityStatusEnum;
}

export class VisibilityStatus extends ValueObject<VisibilityStatusProps> {

    public constructor(status: VisibilityStatusEnum) {
        if (!Object.values(VisibilityStatusEnum).includes(status)) {
            throw new Error(`El valor de estado de visibilidad '${status}' no es válido.`);
        }
        super({ value: status });
    }
    
    public get value(): VisibilityStatusEnum {return this.properties.value;}
}