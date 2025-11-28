import { UuidVO } from "../../abstractions/vo.id";

export class UserId extends UuidVO {
    public constructor(id: string) {
        super(id); 
    }
}