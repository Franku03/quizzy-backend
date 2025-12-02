import { ValueObject } from "src/core/domain/abstractions/value.object";
import { SlideId } from '../../../core/domain/shared-value-objects/id-objects/kahoot.slide.id';

interface SessionProgressProps {
    currentSlide: SlideId,
    totalSlides: number,
    slidesAnswered: number
}

export class SessionProgress extends ValueObject<SessionProgressProps> {


    private constructor( props: SessionProgressProps ){

        super({ ...props });

    }

    public static create(currentSlide: SlideId, totalSlides: number, slidesAnswered: number ): SessionProgress {

        if( !Number.isInteger( totalSlides) || !Number.isInteger( slidesAnswered ))
            throw new Error('Ya se el numero de totalSlides o el numero de slidesAnswered dado no es un número entero');

        if( totalSlides < 1 )
            throw new Error('El número de slides en total es menor a 1');

        if( slidesAnswered < 0 )
            throw new Error('El número de slides respondidas es menor a 0');

        return new SessionProgress({ currentSlide, totalSlides, slidesAnswered });

    }

    public addSlideAnswered( nextSlide: SlideId ): SessionProgress {

        if( !this.hasMoreSlidesLeft() )
            return this; // Para evitar que podamos actualizar el progreso si no hay mas slides restantes

        return new SessionProgress({ 
            currentSlide: nextSlide,
            totalSlides: this.properties.totalSlides, 
            slidesAnswered: this.properties.slidesAnswered + 1 
        });
    }

    public getProgressPercentage(): number {

        return ( this.properties.slidesAnswered*100 ) / this.properties.totalSlides; 
        
    }

    public hasMoreSlidesLeft(): boolean {

        return this.properties.slidesAnswered < this.properties.totalSlides; 

    }

    // * Quizas no use este metodo pero lo dejare por los momentos
    public getHowManySlidesAreLeft(): number{

        return this.properties.totalSlides - this.properties.slidesAnswered; 

    }

}