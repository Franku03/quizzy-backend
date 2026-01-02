// src/core/domain/value-objects/theme-id.vo.ts
import { Either, ErrorData } from "src/core/types";
import { UuidVO } from "src/core/domain/abstractions/vo.id";

export class ThemeId extends UuidVO {
    public constructor(value: string) {
         
        super(value);
        console.log("themeidclass")
    }

    public static create(value: string): Either<ErrorData, ThemeId> {
        // Si el check pasa, hacemos el new. Si no, devolvemos el error. 
        return this.check(value, 'ThemeId')
            .map(validId => new ThemeId(validId));
    }
}