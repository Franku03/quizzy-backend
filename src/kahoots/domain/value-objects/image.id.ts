import { UuidVO } from "src/core/domain/vo.id";

export class ImageId extends UuidVO {
    public constructor(value: string) {
        super(value); 
    }
    
}