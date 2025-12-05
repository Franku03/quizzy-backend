export class Either<TLeft, TRight> {
    // Left Failure, Right success
    private readonly value: TLeft | TRight;
    private readonly left: boolean;

    
    private constructor( value: TLeft | TRight, left: boolean ){
        this.value = value;
        this.left = left;
    }

    isLeft(): boolean {
        return this.left;
    }

    getLeft(): TLeft {
        if( !this.isLeft() ) throw new Error('There is no Left value to return');
        return <TLeft> this.value;
    }

    isRight(): boolean{
        return !this.left;
    }

    getRight(): TRight {
        if( !this.isRight() ) throw new Error('There is no Right value tu return');
        return <TRight> this.value;
    }

    static makeLeft<TLeft, TRight>( value: TLeft ){
        return new Either<TLeft, TRight>( value, true );
    }

    static makeRight<TLeft, TRight>( value: TRight ){
        return new Either<TLeft, TRight>( value, false);
    }

    static isEither(obj: unknown): obj is Either<unknown, unknown> {
        return obj instanceof Either;
    }
}