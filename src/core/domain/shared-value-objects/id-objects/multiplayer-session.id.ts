import { UuidVO } from "../../abstractions/vo.id";

export class MultiplayerSessionId extends UuidVO {
    public constructor(id: string) {
        super(id);
    } 
}