import { Injectable } from '@nestjs/common';
import { CreateKahootDTO, SlideInputDTO, OptionInputDTO, UpdateKahootDTO } from 'src/kahoots/infrastructure/nest-js/dtos';
import { CreateKahootCommand, KahootSlideCommand, KahootOptionCommand, UpdateKahootCommand } from 'src/kahoots/application/commands';
import { IKahootMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper';

@Injectable() 
export class KahootNestMapperAdapter implements IKahootMapper<CreateKahootDTO, UpdateKahootDTO> { 

    // Mapea las opciones del DTO de entrada (OptionInputDTO) a comandos de dominio (KahootOptionCommand).
    private mapOptions = (optionsInput: OptionInputDTO[] | undefined): KahootOptionCommand[] | undefined => {
        return optionsInput?.map(opt => new KahootOptionCommand({
            text: opt.text ?? "", 
            isCorrect: opt.isCorrect,
            optionImage: opt.mediaId 
        }));
    }

    // Mapea los slides (preguntas) del DTO de entrada a comandos de dominio (KahootSlideCommand).
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

    // Extrae y mapea los slides, devolviendo el resto de las propiedades base (sin 'questions').
    private mapBaseFields<T extends { questions?: SlideInputDTO[] }>(input: T) {
        const slides = this.mapSlides(input.questions);
        const { questions, ...baseProps } = input;
        
        return {
            ...baseProps, 
            slides: slides,
        };
    }

    // --- MÉTODOS DE COMANDO ---

    // Mapea el DTO de creación al comando CreateKahootCommand.
    public toCreateCommand(input: CreateKahootDTO): CreateKahootCommand {
        
        const baseProps = this.mapBaseFields(input);
        const {questions, ...rest } = input;

        return new CreateKahootCommand({
            ...rest, 
            ...baseProps,
        });
    }
    
    // Mapea el DTO a un comando de actualización parcial (PATCH).
    // Excluye campos inmutables y filtra valores 'undefined'.
    public toUpdateCommand(input: UpdateKahootDTO, id: string): UpdateKahootCommand {
        
        // 1. Desestructuración: Se extraen los campos inmutables/especiales para ignorarlos.
        const { 
            createdAt, 
            questions, 
            themeId, 
            id: kahootId, 
            authorId, 
            playCount, 
            ...rest // El resto de propiedades actualizables
        } = input;
        
        // 2. Mapeo de slides y combinación de propiedades.
        const updatesOnly = {
            ...rest,
            ...this.mapBaseFields(input), 
            createdAt: createdAt ? new Date(createdAt) : undefined,
        };
        
        // 3. Aplica el filtro (comportamiento PATCH): Elimina todas las propiedades con valor 'undefined'.
        const filteredUpdates = Object.fromEntries(
            Object.entries(updatesOnly).filter(([, value]) => value !== undefined)
        );

        return new UpdateKahootCommand({
            ...filteredUpdates,
            id: id,
            themeId: themeId!, // themeId es obligatorio en el comando, se usa aserción no nula.
        });
    }
    
    // Mapea el DTO a un comando de reemplazo total (PUT).
    // Excluye campos inmutables pero mantiene los valores 'undefined' para sobrescribir.
    public toReplaceCommand(input: UpdateKahootDTO, id: string): UpdateKahootCommand {
        
        // 1. Desestructuración: Se extraen los campos inmutables/especiales para ignorarlos.
        const { 
            createdAt, 
            questions, 
            themeId, 
            id: kahootId, 
            authorId, 
            playCount, 
            ...updatesBody // El resto de propiedades actualizables
        } = input;

        // 2. Mapeo de slides y combinación de propiedades.
        const updateProps = {
            ...updatesBody, 
            ...this.mapBaseFields(input), 
            createdAt: createdAt ? new Date(createdAt) : undefined,
        };
        
        // 3. Comportamiento PUT: No se filtra, se pasan todos los campos (incluyendo 'undefined').
        return new UpdateKahootCommand({
            ...updateProps, 
            id: id,
            themeId: themeId!, // themeId es obligatorio en el comando, se usa aserción no nula.
        });
    }
}