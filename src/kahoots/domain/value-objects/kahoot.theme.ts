import { UuidVO } from "src/core/domain/abstractions/vo.id";

export class ThemeId extends UuidVO {
    public constructor(value: string) {
        super(value);
    } 
}