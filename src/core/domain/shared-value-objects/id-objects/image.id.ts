import { UuidVO } from "../../abstractions/vo.id";

export class ImageId extends UuidVO {
    public constructor(value: string) {
        super(value); 
    }
    
}