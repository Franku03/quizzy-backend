import { Either, ErrorData } from "src/core/types";
import { UuidVO } from "../../abstractions/vo.id";

export class UserId extends UuidVO {
    public constructor(id: string) {
        super(id);
    }

    public static create(value: string): Either<ErrorData, UserId> {
        return this.check(value, 'UserId')
            .map(validId => new UserId(validId));
    }
}