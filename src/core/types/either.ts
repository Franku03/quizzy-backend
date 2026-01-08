export class Either<TLeft, TRight> {
    private readonly value: TLeft | TRight;
    private readonly left: boolean;

    private constructor(value: TLeft | TRight, left: boolean) {
        this.value = value;
        this.left = left;
    }

    // --- stATe ---

    /** Retorna true si el objeto contiene un valor de tipo TLeft */
    isLeft(): boolean { return this.left; }

    /** Retorna true si el objeto contiene un valor de tipo TRight */
    isRight(): boolean { return !this.left; }

    /** Extrae el valor Left. Lanza error si se intenta acceder a un valor inexistente */
    getLeft(): TLeft {
        if (!this.isLeft()) throw new Error('No existe valor Left');
        return <TLeft>this.value;
    }

    /** Extrae el valor Right. Lanza error si se intenta acceder a un valor inexistente */
    getRight(): TRight {
        if (!this.isRight()) throw new Error('No existe valor Right');
        return <TRight>this.value;
    }

    // --- Fábricas Estáticas ---

    /** Crea una instancia representando un fallo o valor izquierdo */
    static makeLeft<TLeft, TRight>(value: TLeft): Either<TLeft, TRight> {
        return new Either<TLeft, TRight>(value, true);
    }

    /** Crea una instancia representando un éxito o valor derecho */
    static makeRight<TLeft, TRight>(value: TRight): Either<TLeft, TRight> {
        return new Either<TLeft, TRight>(value, false);
    }

    // --- Transformaciones Sincrónicas ---

    /** Transforma el valor Right mediante una función; mantiene el Left si existe */
    map<TNewRight>(fn: (val: TRight) => TNewRight): Either<TLeft, TNewRight> {
        if (this.isLeft()) return Either.makeLeft<TLeft, TNewRight>(this.getLeft());
        return Either.makeRight<TLeft, TNewRight>(fn(this.getRight()));
    }

    /** Transforma el valor Left mediante una función; mantiene el Right si existe */
    mapLeft<TNewLeft>(fn: (err: TLeft) => TNewLeft): Either<TNewLeft, TRight> {
        if (this.isRight()) return Either.makeRight<TNewLeft, TRight>(this.getRight());
        return Either.makeLeft<TNewLeft, TRight>(fn(this.getLeft()));
    }

    /** Encadena otra operación que devuelve un Either; ideal para validaciones secuenciales */
    chain<TNewRight>(fn: (val: TRight) => Either<TLeft, TNewRight>): Either<TLeft, TNewRight> {
        if (this.isLeft()) return Either.makeLeft<TLeft, TNewRight>(this.getLeft());
        return fn(this.getRight());
    }

    // --- Operaciones Asincrónicas ---

    /** Encadena una operación asíncrona que devuelve un Promise<Either> */
    async chainAsync<TNewRight>(fn: (val: TRight) => Promise<Either<TLeft, TNewRight>>): Promise<Either<TLeft, TNewRight>> {
        if (this.isLeft()) return Either.makeLeft<TLeft, TNewRight>(this.getLeft());
        return await fn(this.getRight());
    }

    /** Transforma el valor Right mediante una promesa; retorna Promise<Either> */
    async mapAsync<TNewRight>(fn: (val: TRight) => Promise<TNewRight>): Promise<Either<TLeft, TNewRight>> {
        if (this.isLeft()) return Either.makeLeft<TLeft, TNewRight>(this.getLeft());
        const result = await fn(this.getRight());
        return Either.makeRight<TLeft, TNewRight>(result);
    }

    /** Ejecuta un efecto asíncrono y mantiene el valor original si el efecto tiene éxito */
    async tapChainAsync(fn: (val: TRight) => Promise<Either<TLeft, any>>): Promise<Either<TLeft, TRight>> {
        if (this.isLeft()) return Either.makeLeft<TLeft, TRight>(this.getLeft());
        const result = await fn(this.getRight());
        if (result.isLeft()) return Either.makeLeft<TLeft, TRight>(result.getLeft());
        return Either.makeRight<TLeft, TRight>(this.getRight());
    }

    /**
     * Ejecuta un efecto asíncrono solo si es Left y retorna el Either original.
     */
    async tapLeftAsync(fn: (err: TLeft) => Promise<void>): Promise<Either<TLeft, TRight>> {
        if (this.isLeft()) {
            await fn(this.getLeft());
        }
        return this;
    }

    // --- Flujos Condicionales (Sincrónicos) ---

    /** Ejecuta el encadenamiento solo si NO se cumple la condición proporcionada */
    chainUnless<TNewRight>(
        condition: (val: TRight) => boolean,
        fn: (val: TRight) => Either<TLeft, TNewRight>
    ): Either<TLeft, TRight | TNewRight> {
        if (this.isLeft()) return Either.makeLeft(this.getLeft());

        // Si la condición se cumple, "saltamos" la función y seguimos con el valor actual
        if (condition(this.getRight())) {
            return Either.makeRight(this.getRight());
        }

        // Si no se cumple, ejecutamos la lógica
        return fn(this.getRight());
    }

    // --- Flujos Condicionales (Asincrónicos) ---

    /** Ejecuta el encadenamiento asíncrono solo si NO se cumple la condición proporcionada */
    async chainUnlessAsync<TNewRight>(
        condition: (val: TRight) => boolean,
        fn: (val: TRight) => Promise<Either<TLeft, TNewRight>>
    ): Promise<Either<TLeft, TRight | TNewRight>> {
        if (this.isLeft()) return Either.makeLeft(this.getLeft());
        if (condition(this.getRight())) return Either.makeRight(this.getRight());
        return await fn(this.getRight());
    }

    /** Transforma el valor mediante una promesa solo si NO se cumple la condición proporcionada */
    async mapUnlessAsync<TNewRight>(
        condition: (val: TRight) => boolean,
        fn: (val: TRight) => Promise<TNewRight>
    ): Promise<Either<TLeft, TRight | TNewRight>> {
        if (this.isLeft()) return Either.makeLeft(this.getLeft());
        if (condition(this.getRight())) return Either.makeRight(this.getRight());
        const result = await fn(this.getRight());
        return Either.makeRight(result);
    }

    //** Para desaperecer try-catch */
    static async tryCatch<L, R>(
        promise: Promise<R>,
        onError: (error: unknown) => L
    ): Promise<Either<L, R>> {
        try {
            const data = await promise;
            return Either.makeRight<L, R>(data);
        } catch (error) {
            return Either.makeLeft<L, R>(onError(error));
        }
    }
    // --- Utilidades de Tipado ---

    /** Type Guard para verificar si un objeto es una instancia de Either */
    static isEither<L, R>(obj: unknown): obj is Either<L, R> {
        return obj instanceof Either;
    }
}