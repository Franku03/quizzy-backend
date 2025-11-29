import { Optional } from "src/core/types/optional";
import { Question } from "../value-objects/kahoot.slide.question";
import { TimeLimitSeconds } from "../../../core/domain/shared-value-objects/value-objects/value.object.time-limit-seconds";
import { Points } from "../../../core/domain/shared-value-objects/value-objects/value.object.points";
import { SlideType, SlideTypeEnum } from '../value-objects/kahoot.slide.type';
import { Entity } from "src/core/domain/abstractions/entity";
import { SlideId } from "../../../core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { ImageId } from "../../../core/domain/shared-value-objects/id-objects/image.id";
import { Option } from "../value-objects/kahoot.slide.option";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { Submission } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Result } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { Description } from "../value-objects/kahoot.slide.description";
import { SlideTypeValidator } from "../helpers/slide.validador";

export interface SlideProps {
    position: number;
    slideType: SlideType; 
    timeLimit: TimeLimitSeconds;
    // VOs Opcionales
    question: Optional<Question>; //Se revisa en publish
    slideImage: Optional<ImageId>; //Puede existir sin esto (no problema)
    points: Optional<Points>; //Se revisa en publish
    options: Optional<Option[]>; //Se revisa en publish
    description: Optional<Description>
    evalStrategy: EvaluationStrategy; //Deberia extraerse a domain service
}

export abstract class Slide extends Entity<SlideProps, SlideId> {
    
    //valida sus invariantes minimas

    public constructor(props: SlideProps, id: SlideId) {
        Slide.checkBaseinitialInvariants(props);
        super(props, id);
    }


    private static checkBaseinitialInvariants(props: SlideProps): void {

        if (props.position < 0) {
            throw new Error("La posición del slide no puede ser negativa.");
        }
        if (!props.slideType || !props.timeLimit) {
             throw new Error("El slide debe tener SlideType y TimeLimit definidos.");
        } 
    }
    
    //Comportamiento propio de la class e invariantes comunes (manejadas por sus VO (gracias a Dios))
    public changePosition(newPosition: number): void {
        if (newPosition < 0) {
            throw new Error("La nueva posición no es válida.");
        }
        this.properties.position = newPosition; 
    }
    public updateQuestion(newQuestion: Optional<Question>): void {
        this.properties.question = newQuestion;
    }
    public updateSlideImage(newImageId: Optional<ImageId>): void {
        this.properties.slideImage = newImageId;
    }
    public updateTimeLimit(newTimeLimit: TimeLimitSeconds): void {
        this.properties.timeLimit = newTimeLimit;
    }
    public updatePoints(newPoints: Optional<Points>): void {
        this.properties.points = newPoints;
    }
    public removeOptionByIndex(indexToDelete: number): void {
        const currentOptions = this.properties.options.hasValue() 
            ? this.properties.options.getValue() 
            : [];
            
        if (indexToDelete < 0 || indexToDelete >= currentOptions.length) {
            throw new Error("Índice de opción fuera de rango.");
        }
        
        const newOptionsArray = currentOptions.filter((NotUsedIndex, index) => index !== indexToDelete);
        
        this.properties.options = new Optional(newOptionsArray);
    }


    //Invariantes que dependen de cada tipo de slide
    public updateSlideType(newSlideType: SlideType): void {
        SlideTypeValidator.validatePropsForNewType(newSlideType, this.properties)
        this.properties.slideType = newSlideType; 
    }
    public addOption(newOption: Option): void {
        this.properties.slideType.canHaveOption();
        if(newOption.hasImage()) {
            this.properties.slideType.canHaveOptionImage();
        }
        const currentOptions = this.properties.options.hasValue() 
            ? this.properties.options.getValue() 
            : [];
            
        const newOptionsArray = [...currentOptions, newOption];
        
        this.properties.options = new Optional(newOptionsArray);
        this.checkStructuralOptionLimits(this.getOptionsList());
    }
    public updateOption(indexToUpdate: number, newOption: Option): void {
        this.properties.slideType.canHaveOption();
        if(newOption.hasImage()) {
            this.properties.slideType.canHaveOptionImage();
        }
        const currentOptions = this.getOptionsList();
        
        if (indexToUpdate < 0 || indexToUpdate >= currentOptions.length) {
            throw new Error("Índice de opción fuera de rango para actualizar.");
        }
        
        const newOptionsArray = [...currentOptions];
        
        newOptionsArray[indexToUpdate] = newOption; 

        this.properties.options = new Optional(newOptionsArray);
    }
    public changeDescription(newDesciption: Description): void{
        this.properties.slideType.canHaveDescription()
        this.properties.description = new Optional(newDesciption);
    }
    private checkStructuralOptionLimits(options: Option[]): void {
        const max = this.getMaxOptions(); 
        if (options.length > max) {
            throw new Error(`Máximo de opciones excedido. Este tipo de slide ${this.properties.slideType.getType()} solo permite ${max} opciones.`);
        }
    }
    //Comportamiento puro
    public evaluateAnswer(submission: Submission): Result {
        return this.properties.evalStrategy.evaluateAnswer(submission, this.getOptionsList());
    }
    public getOptionsList(): Option[] {
        const optionalOptions = this.properties.options; 
        return optionalOptions.hasValue() ? optionalOptions.getValue() : [];
    }
    public getPoints(): Optional<Points> {
        return this.properties.points;
    }

    
    //Utilizado por Kahoot
    public isPublishingCompliant(): boolean {
        try {
            this.validatePublishingInvariants(); 
            return true; 
        } catch (e) {
            return false;
        }
    }
    public abstract validatePublishingInvariants(): void 
    public abstract getMaxOptions(): number;
    public abstract changeEvaluationStrategy(newStrategy: EvaluationStrategy): void
    
}