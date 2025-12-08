import { Injectable } from '@nestjs/common';
import { CreateKahootDTO, SlideInputDTO, OptionInputDTO, UpdateKahootDTO } from 'src/kahoots/infrastructure/nest-js/dtos';
import { CreateKahootCommand, KahootSlideCommand, KahootOptionCommand, UpdateKahootCommand } from 'src/kahoots/application/commands';
import { IKahootRequestMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper';

@Injectable() 
export class KahootNestMapperAdapter implements IKahootRequestMapper<CreateKahootDTO, UpdateKahootDTO> { 

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

    public toCreateCommand(input: CreateKahootDTO, userId: string): CreateKahootCommand {
        const baseProps = this.mapBaseFields(input);
        const { questions, coverImageId, ...rest } = input;

        return new CreateKahootCommand({
            ...rest, 
            ...baseProps,
            imageId: coverImageId,
            userId,
        });
    }
    
    /*public toUpdateCommand(input: UpdateKahootDTO, id: string, userId: string): UpdateKahootCommand {
        // Extraemos solo las propiedades que el cliente debería enviar
        const { 
            id: dtoId, // ⚠️ IGNORAR: No usar este id, usar el parámetro 'id'
            createdAt: dtoCreatedAt, // ⚠️ IGNORAR: No debería venir del cliente
            playCount: dtoPlayCount, // ⚠️ IGNORAR: No debería venir del cliente
            questions, 
            coverImageId,
            ...rest 
        } = input;
        
        const updatesOnly = {
            ...rest,
            ...this.mapBaseFields(input), 
            imageId: coverImageId,
        };
        
        // Eliminamos propiedades undefined para actualización parcial
        const filteredUpdates = Object.fromEntries(
            Object.entries(updatesOnly).filter(([, value]) => value !== undefined)
        );

        return new UpdateKahootCommand({
            ...filteredUpdates,
            id: id, // Usamos el id del parámetro, no del DTO
            userId,
        });
    }*/
    
    public toReplaceCommand(input: UpdateKahootDTO, id: string, userId: string): UpdateKahootCommand {
        // Extraemos las propiedades que el cliente puede enviar
        const { 
            id: dtoId, // ⚠️ IGNORAR: No usar este id
            createdAt: dtoCreatedAt, // ⚠️ IGNORAR: Para replace, usamos valor por defecto
            playCount: dtoPlayCount, // ⚠️ IGNORAR: Para replace, usamos valor por defecto
            questions, 
            coverImageId,
            ...updatesBody 
        } = input;

        // Para replace necesitamos todos los campos requeridos
        const replaceProps = {
            ...updatesBody, 
            ...this.mapBaseFields(input), 
            imageId: coverImageId,
            // Para replace, proporcionamos valores por defecto para campos requeridos
            createdAt: new Date(), // Valor por defecto para replace
            playCount: 0, // Valor por defecto para replace
        };
        
        return new UpdateKahootCommand({
            ...replaceProps, 
            id: id,
            userId
        });
    }
}