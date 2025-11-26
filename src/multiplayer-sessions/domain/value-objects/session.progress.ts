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
            throw new Error('Either the number of totalSlides or the number of slidesAnswered supplied is not an integer number');
        
        super({ totalSlides, slidesAnswered });

    }

    public addSlideAnswered(): SessionProgress {
        return new SessionProgress( this.properties.totalSlides, this.properties.slidesAnswered + 1 );
    }

    public getProgressPercentage(): number {
        return ( this.properties.slidesAnswered*100 ) / this.properties.totalSlides; 
    }

}