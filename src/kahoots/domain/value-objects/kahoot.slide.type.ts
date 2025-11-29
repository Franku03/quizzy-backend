import { ValueObject } from "src/core/domain/abstractions/value.object";
import { MAX_OPTION_CHARS_TYPEANSWER, MAX_OPTION_TEXT_LENGTH } from "../constants/kahoot.slide.rules";

export enum SlideTypeEnum {
    SINGLE = "SINGLE",
    MULTIPLE = "MULTIPLE",
    TRUE_FALSE = "TRUE_FALSE",
    SHORT_ANSWER = "SHORT_ANSWER",
    POLL = "POLL",
    SLIDE = "SLIDE" 
}

interface SlideTypeProps {
    readonly type: SlideTypeEnum;
}

export class SlideType extends ValueObject<SlideTypeProps> {

    public constructor(rawType: string) {
        
        if (!rawType || rawType.trim().length === 0) {
            throw new Error("El tipo de quiz no puede estar vacío.");
        }
        
        const upperCaseType = rawType.toUpperCase();

        if (!Object.values(SlideTypeEnum).includes(upperCaseType as SlideTypeEnum)) {
            throw new Error(`El tipo de quiz '${rawType}' no es un valor canónico permitido.`);
        }
        
        const validType = upperCaseType as SlideTypeEnum;
        
        super({ type: validType });
    }

    public getType(): SlideTypeEnum {
        return this.properties.type;
    }

    public canHaveDescription():void {
        if(this.getType() !== SlideTypeEnum.SLIDE) 
            throw new Error(`Los slides de tipo ${this.getType()} no tienen descripcion`)
    }
    
    public canHaveOption():void {
        if(this.getType() === SlideTypeEnum.SLIDE) 
            throw new Error(`Los slides de tipo ${this.getType()} no tienen opciones`)
    }

    public canHavePoints():void {
        if(this.getType() === SlideTypeEnum.SLIDE) 
            throw new Error(`Los slides de tipo ${this.getType()} no tienen opciones`)
    }

    public canHaveOptionImage():void {
        if(this.getType() === SlideTypeEnum.SLIDE || SlideTypeEnum.TRUE_FALSE || SlideTypeEnum.SHORT_ANSWER ) 
            throw new Error(`Los slides de tipo ${this.getType()} no tienen opciones con imagenes`)
    }

    public getMaxSlideLength():number{
        if(this.getType() === SlideTypeEnum.SHORT_ANSWER) return MAX_OPTION_CHARS_TYPEANSWER;
        return MAX_OPTION_TEXT_LENGTH
    }
    
}