import { UuidVO } from "src/core/domain/abstractions/vo.id";

export class GroupMemberId extends UuidVO {
    constructor(value: string) {
        super(value);
    }
}