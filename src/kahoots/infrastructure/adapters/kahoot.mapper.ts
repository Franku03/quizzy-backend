import { Injectable } from '@nestjs/common';
import { CreateKahootDTO, SlideInputDTO, OptionInputDTO, UpdateKahootDTO, KahootBaseFieldsDTO } from 'src/kahoots/infrastructure/nest-js/dtos/kahoot-input.dto';
import { CreateKahootCommand, KahootSlideCommand, KahootOptionCommand, UpdateKahootCommand } from 'src/kahoots/application/commands';
import { IKahootMapper } from 'src/kahoots/application/ports/i-kahoot.mapper';

@Injectable() 
export class KahootNestMapperAdapter implements IKahootMapper<CreateKahootDTO, UpdateKahootDTO> { 

    private mapOptions = (optionsInput: OptionInputDTO[] | undefined): KahootOptionCommand[] | undefined => {
        return optionsInput?.map(opt => new KahootOptionCommand({
            text: opt.text ?? "", 
            isCorrect: opt.isCorrect,
            optionImage: opt.mediaId 
        }));
    }

    private mapSlides = (slidesInput: SlideInputDTO[] | undefined): KahootSlideCommand[] | undefined => {
        return slidesInput?.map((slide, index) => {
        
            const { 
                answers, 
                type: slideType, 
                timeLimit, 
                text: question, 
                mediaId: slideImage, 
                points: pointsValue, 
                ...restOfProps 
            } = slide;

            return new KahootSlideCommand({
                ...restOfProps, 
                slideType,
                timeLimit, 
                question,
                slideImage,
                points: pointsValue,
                description: "", 
                position: index, 
                options: this.mapOptions(answers),
            });
        });
    }

    private mapBaseFields<T extends KahootBaseFieldsDTO>(input: T) {
        const slides = this.mapSlides(input.questions);
        const { questions, ...baseProps } = input;
        
        return {
            ...baseProps, 
            slides: slides,
        };
    }

    public toCreateCommand(input: CreateKahootDTO): CreateKahootCommand {
        
        const baseProps = this.mapBaseFields(input);
        const {questions, ...rest } = input;

        return new CreateKahootCommand({
            ...rest, 
            ...baseProps,
        });
    }
    
    public toUpdateCommand(input: UpdateKahootDTO, id: string): UpdateKahootCommand {
        
        const baseProps = this.mapBaseFields(input);
        const { createdAt, questions, ...rest } = input;
        
        const updatesOnly = {
            ...rest,
            ...baseProps,
            createdAt: createdAt ? new Date(createdAt) : undefined,
        };

        const filteredUpdates = Object.fromEntries(
            Object.entries(updatesOnly).filter(([unused, value]) => value !== undefined)
        );

        return new UpdateKahootCommand({
            ...filteredUpdates,
            id: id, 
        });
    }
}