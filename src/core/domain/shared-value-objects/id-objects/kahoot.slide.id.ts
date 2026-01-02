import { Either, ErrorData } from "src/core/types";
import { UuidVO } from "../../abstractions/vo.id";

export class SlideId extends UuidVO {
    public constructor(value: string) {
        super(value);
    } 

    public static create(value: string): Either<ErrorData, SlideId> {
        return UuidVO.check(value, 'SlideId')
            .map(validId => new SlideId(validId));
    }
}