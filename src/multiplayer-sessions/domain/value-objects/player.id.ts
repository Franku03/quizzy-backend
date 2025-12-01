import { UuidVO } from "src/core/domain/abstractions/vo.id";

export class PlayerId extends UuidVO {

    public constructor(id: string ) {    
        super(id); 
    }

}

