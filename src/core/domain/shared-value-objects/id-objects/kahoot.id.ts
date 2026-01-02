import { Either, ErrorData } from "src/core/types";
import { UuidVO } from "../../abstractions/vo.id";

export class KahootId extends UuidVO {
    public constructor(id: string) {
        super(id); 
    }

    public static create(value: string): Either<ErrorData, KahootId> {
        return UuidVO.check(value, 'KahootId')
            .map(validId => new KahootId(validId));
    }
}