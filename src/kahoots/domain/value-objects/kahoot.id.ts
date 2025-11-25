import { UuidVO } from "src/core/domain/vo.id"; 

export class KahootId extends UuidVO {
    public constructor(id: string) {
        super(id); 
    }
}