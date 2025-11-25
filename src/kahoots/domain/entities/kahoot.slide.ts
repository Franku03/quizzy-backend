import { Optional } from "src/core/types/optional";
import { Question } from "../value-objects/kahoot.slide.question";
import { TimeLimitSeconds } from "../value-objects/kahoot.slide.time-limit-seconds";
import { Points } from "../value-objects/kahoot.slide.points";
import { SlideType } from "../value-objects/kahoot.slide.type.abstract";
import { Entity } from "src/core/domain/entity";
import { SlideId } from "../value-objects/kahoot.slide.id";
import { ImageId } from "../value-objects/image.id";
import { Option } from "../value-objects/kahoot.slide.option";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { Submission } from "../helpers/parameter.object.submission";
import { Result } from "../helpers/parameter.object.result";

interface SlideProps {
    position: number;
    slideType: SlideType; 
    timeLimit: TimeLimitSeconds;
    // VOs Opcionales
    question: Optional<Question>; 
    slideImage: Optional<ImageId>; 
    points: Optional<Points>; 
    options: Optional<Option[]>; 
}

export class Slide extends Entity<SlideProps, SlideId> {
    

    public constructor(props: SlideProps, id: SlideId) {

        if (props.position < 0) {
            throw new Error("La posición del slide no puede ser negativa.");
        }
        if (!props.slideType || !props.timeLimit) {
             throw new Error("El slide debe tener SlideType y TimeLimit definidos.");
        } 
        super(props, id);
    }

    public changePosition(newPosition: number): void {
        if (newPosition < 0) {
            throw new Error("La nueva posición no es válida.");
        }
        this.properties.position = newPosition; 
    }
    
    public validateInvariants(): void {
        this.properties.slideType.validateInvariants(this);
    }
    
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): void {
        const newSlideType = this.properties.slideType.changeEvaluationStrategy(newStrategy);
        this.properties.slideType = newSlideType; 
        this.validateInvariants();
    }
 
    public evaluateAnswer(submission: Submission): Result {
        return this.properties.slideType.evaluateAnswer(submission, this.getOptions());
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
    public getOptions(): Option[] {
        const optionalOptions = this.properties.options; 
        return optionalOptions.hasValue() ? optionalOptions.getValue() : [];
    }

    public getPoints(): Optional<Points> {
        return this.properties.points;
    }

    public addOption(newOption: Option): void {
        const currentOptions = this.properties.options.hasValue() 
            ? this.properties.options.getValue() 
            : [];
            
        const newOptionsArray = [...currentOptions, newOption];
        
        this.properties.options = new Optional(newOptionsArray);
        this.checkStructuralOptionLimits(this.getOptions());
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

    public updateOption(indexToUpdate: number, newOption: Option): void {
        const currentOptions = this.getOptions();
        
        if (indexToUpdate < 0 || indexToUpdate >= currentOptions.length) {
            throw new Error("Índice de opción fuera de rango para actualizar.");
        }
        
        const newOptionsArray = [...currentOptions];
        
        newOptionsArray[indexToUpdate] = newOption; 

        this.properties.options = new Optional(newOptionsArray);
    }

    private checkStructuralOptionLimits(options: Option[]): void {

        const max = this.properties.slideType.getMaxOptions(); 
        
        if (options.length > max) {
            throw new Error(`Máximo de opciones excedido. Este tipo de slide ${this.properties.slideType.getType()} solo permite ${max} opciones.`);
        }
    }
    
}