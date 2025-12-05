import { UuidVO } from "src/core/domain/abstractions/vo.id";

export class GroupAssignmentId extends UuidVO {
    constructor(value: string) {
        super(value);
    }
}