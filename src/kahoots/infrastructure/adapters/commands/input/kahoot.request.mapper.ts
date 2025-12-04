import { Injectable } from '@nestjs/common';
import { CreateKahootDTO, SlideInputDTO, OptionInputDTO, UpdateKahootDTO } from 'src/kahoots/infrastructure/nest-js/dtos';
import { CreateKahootCommand, KahootSlideCommand, KahootOptionCommand, UpdateKahootCommand } from 'src/kahoots/application/commands';
import { IKahootMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper';

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

    private mapBaseFields<T extends { questions?: SlideInputDTO[] }>(input: T) {
        const slides = this.mapSlides(input.questions);
        const { questions, ...baseProps } = input;
        
        return {
            ...baseProps, 
            slides: slides,
        };
    }

    public toCreateCommand(input: CreateKahootDTO): CreateKahootCommand {
        const baseProps = this.mapBaseFields(input);
        const { questions, coverImageId, ...rest } = input;

        return new CreateKahootCommand({
            ...rest, 
            ...baseProps,
            imageId: coverImageId,
        });
    }
    
    public toUpdateCommand(input: UpdateKahootDTO, id: string): UpdateKahootCommand {
        const { 
            createdAt, 
            questions, 
            themeId, 
            id: kahootId, 
            authorId, 
            playCount, 
            coverImageId,
            ...rest 
        } = input;
        
        const updatesOnly = {
            ...rest,
            ...this.mapBaseFields(input), 
            imageId: coverImageId,
            createdAt: createdAt ? new Date(createdAt) : undefined,
        };
        
        const filteredUpdates = Object.fromEntries(
            Object.entries(updatesOnly).filter(([, value]) => value !== undefined)
        );

        return new UpdateKahootCommand({
            ...filteredUpdates,
            id: id,
            themeId: themeId!,
        });
    }
    
    public toReplaceCommand(input: UpdateKahootDTO, id: string): UpdateKahootCommand {
        const { 
            createdAt, 
            questions, 
            themeId, 
            id: kahootId, 
            authorId, 
            playCount, 
            coverImageId,
            ...updatesBody 
        } = input;

        const updateProps = {
            ...updatesBody, 
            ...this.mapBaseFields(input), 
            imageId: coverImageId,
            createdAt: createdAt ? new Date(createdAt) : undefined,
        };
        
        return new UpdateKahootCommand({
            ...updateProps, 
            id: id,
            themeId: themeId!,
        });
    }
}