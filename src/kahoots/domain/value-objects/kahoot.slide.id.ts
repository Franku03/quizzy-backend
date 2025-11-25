import { UuidVO } from "src/core/domain/vo.id";

export class SlideId extends UuidVO {
    public constructor(value: string) {
        super(value);
    } 
}