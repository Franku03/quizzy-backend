import { ValueObject } from "src/core/domain/abstractions/value.object";

interface SessionProgressProps {
    totalSlides: number,
    slidesAnswered: number
}

export class SessionProgress extends ValueObject<SessionProgressProps> {


    constructor(
        totalSlides: number,
        slidesAnswered: number
    ){

        if( !Number.isInteger( totalSlides) || !Number.isInteger( slidesAnswered ))
            throw new Error('Ya se el numero de totalSlides o el numero de slidesAnswered dado no es un número entero');

        if( totalSlides < 1 )
            throw new Error('El número de slides en total es menor a 1');

        if( slidesAnswered < 0 )
            throw new Error('El número de slides respondidas es menor a 0');

        super({ totalSlides, slidesAnswered });

    }

    public addSlideAnswered(): SessionProgress {
        return new SessionProgress( this.properties.totalSlides, this.properties.slidesAnswered + 1 );
    }

    public getProgressPercentage(): number {
        return ( this.properties.slidesAnswered*100 ) / this.properties.totalSlides; 
    }

}