import { Either, ErrorData } from "src/core/types";
import { UuidVO } from "../../abstractions/vo.id";

export class ImageId extends UuidVO {
    public constructor(value: string) {
        super(value); 
    }

    public static create(value: string): Either<ErrorData, ImageId> {
        return UuidVO.check(value, 'ImageId')
            .map(validId => new ImageId(validId));
    }
}