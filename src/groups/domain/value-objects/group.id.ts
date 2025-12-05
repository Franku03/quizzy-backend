import { UuidVO } from "src/core/domain/abstractions/vo.id"; 

export class GroupId extends UuidVO {
    constructor(id: string) {
        super(id);
    }
}